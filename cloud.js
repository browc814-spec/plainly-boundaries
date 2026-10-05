window.PlainlyCloud = (() => {
  const EXTRAS_KEY = "plainly.extras.v1";
  let client = null;
  let configured = false;
  let user = null;
  let syncTimer = null;
  let status = "idle"; // idle | loading | signed_in | signed_out | error | syncing
  let lastError = "";
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => {
      try {
        fn(getState());
      } catch (_) {}
    });
  }

  function getState() {
    return {
      configured,
      status,
      user,
      lastError,
      email: user?.email || "",
      name:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        "",
      avatar: user?.user_metadata?.avatar_url || "",
    };
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function loadExtras() {
    try {
      const raw = localStorage.getItem(EXTRAS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveExtrasLocal(extras) {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras || {}));
  }

  function localSnapshot() {
    return {
      profile: window.PlainlyStore.loadProfile(),
      journal: window.PlainlyStore.loadJournal(),
      extras: loadExtras(),
    };
  }

  function applyLocal(snapshot) {
    if (snapshot.profile) {
      window.PlainlyStore.saveProfile({
        ...window.PlainlyStore.emptyProfile(),
        ...snapshot.profile,
        updatedAt: snapshot.profile.updatedAt || Date.now(),
      }, { skipCloud: true });
    }
    if (Array.isArray(snapshot.journal)) {
      window.PlainlyStore.saveJournal(snapshot.journal, { skipCloud: true });
    }
    if (snapshot.extras && typeof snapshot.extras === "object") {
      saveExtrasLocal(snapshot.extras);
    }
  }

  function mergeById(localArr, cloudArr, idKey = "id", timeKey = "updatedAt") {
    const map = new Map();
    [...(cloudArr || []), ...(localArr || [])].forEach((item) => {
      if (!item || !item[idKey]) return;
      const prev = map.get(item[idKey]);
      if (!prev) {
        map.set(item[idKey], item);
        return;
      }
      const prevT = Number(prev[timeKey] || prev.savedAt || prev.createdAt || 0);
      const nextT = Number(item[timeKey] || item.savedAt || item.createdAt || 0);
      map.set(item[idKey], nextT >= prevT ? item : prev);
    });
    return [...map.values()];
  }

  function mergeSnapshots(local, cloud) {
    if (!cloud) return local;
    if (!local) return cloud;

    const localT = Number(local.profile?.updatedAt || 0);
    const cloudT = Number(cloud.updated_at ? Date.parse(cloud.updated_at) : cloud.profile?.updatedAt || 0);

    const baseProfile =
      cloudT >= localT
        ? { ...local.profile, ...cloud.profile }
        : { ...cloud.profile, ...local.profile };

    return {
      profile: {
        ...window.PlainlyStore.emptyProfile(),
        ...baseProfile,
        people: mergeById(local.profile?.people, cloud.profile?.people, "id", "createdAt"),
        crushNotes: mergeById(
          local.profile?.crushNotes,
          cloud.profile?.crushNotes,
          "id",
          "savedAt"
        ),
        dating: mergeById(local.profile?.dating, cloud.profile?.dating, "id", "createdAt"),
        messages: mergeById(
          local.profile?.messages,
          cloud.profile?.messages,
          "id",
          "createdAt"
        ),
        updatedAt: Math.max(localT, cloudT, Date.now()),
      },
      journal: mergeById(local.journal, cloud.journal, "id", "updatedAt"),
      extras: { ...(cloud.extras || {}), ...(local.extras || {}) },
    };
  }

  async function fetchConfig() {
    // Optional local override for development
    if (window.PLAINLY_CLOUD_CONFIG?.url && window.PLAINLY_CLOUD_CONFIG?.anonKey) {
      return {
        configured: true,
        url: window.PLAINLY_CLOUD_CONFIG.url,
        anonKey: window.PLAINLY_CLOUD_CONFIG.anonKey,
      };
    }
    try {
      // Static public config (GitHub Pages has no functions). Relative so it works under any subpath.
      const res = await fetch("./config.json", { cache: "no-store" });
      if (!res.ok) return { configured: false };
      return await res.json();
    } catch (_) {
      return { configured: false };
    }
  }

  async function init() {
    status = "loading";
    emit();
    const config = await fetchConfig();
    configured = Boolean(config?.configured && config.url && config.anonKey);
    if (!configured) {
      status = "signed_out";
      lastError = config?.message || "";
      emit();
      return getState();
    }

    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE returns ?code=... in the query string, which the hash router never touches.
        flowType: "pkce",
      },
    });

    const { data } = await client.auth.getSession();
    user = data.session?.user || null;
    status = user ? "signed_in" : "signed_out";
    emit();

    client.auth.onAuthStateChange((event, session) => {
      user = session?.user || null;
      status = user ? "signed_in" : "signed_out";
      emit();
      if (event === "SIGNED_IN" && user) {
        // Defer: calling Supabase from inside this callback can deadlock the auth lock.
        window.setTimeout(async () => {
          await pullAndMerge();
          try {
            await window.PlainlyConnections?.ensurePublicProfile?.();
          } catch (_) {
            /* connections tables may not exist yet */
          }
        }, 0);
      }
    });

    if (user) {
      await pullAndMerge();
      try {
        await window.PlainlyConnections?.ensurePublicProfile?.();
      } catch (_) {}
    }
    return getState();
  }

  function authRedirectTo() {
    // Return to wherever the app is served from (e.g. https://browc814-spec.github.io/plainly-boundaries/),
    // dropping any file name like index.html so it always matches the "<site>/**" allow-list entry.
    const base = location.pathname.replace(/[^/]*$/, "") || "/";
    return `${location.origin}${base}#profile`;
  }

  async function signInWithGoogle() {
    if (!client) {
      lastError = "Cloud sync isn’t configured yet.";
      status = "error";
      emit();
      return;
    }
    lastError = "";
    const redirectTo = authRedirectTo();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      lastError = error.message;
      status = "error";
      emit();
    }
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    user = null;
    status = "signed_out";
    emit();
  }

  async function pullAndMerge() {
    if (!client || !user) return null;
    status = "syncing";
    emit();
    try {
      const { data, error } = await client
        .from("plainly_data")
        .select("profile, journal, extras, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      const local = localSnapshot();
      if (!data) {
        await pushNow();
        status = "signed_in";
        emit();
        return local;
      }

      const merged = mergeSnapshots(local, data);
      applyLocal(merged);
      await pushNow();
      status = "signed_in";
      emit();
      window.dispatchEvent(new CustomEvent("plainly:cloud-synced"));
      return merged;
    } catch (err) {
      lastError = err.message || String(err);
      status = "error";
      emit();
      return null;
    }
  }

  async function pushNow() {
    if (!client || !user) return;
    const snap = localSnapshot();
    const payload = {
      user_id: user.id,
      profile: snap.profile,
      journal: snap.journal,
      extras: snap.extras,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from("plainly_data").upsert(payload, {
      onConflict: "user_id",
    });
    if (error) throw error;
  }

  function schedulePush() {
    if (!client || !user) return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(async () => {
      try {
        status = "syncing";
        emit();
        await pushNow();
        status = "signed_in";
        lastError = "";
        emit();
      } catch (err) {
        lastError = err.message || String(err);
        status = "error";
        emit();
      }
    }, 650);
  }

  return {
    init,
    signInWithGoogle,
    signOut,
    schedulePush,
    pullAndMerge,
    onChange,
    getState,
    getClient: () => client,
  };
})();

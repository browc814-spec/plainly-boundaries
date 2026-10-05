window.PlainlyConnections = (() => {
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function client() {
    return window.PlainlyCloud?.getClient?.() || null;
  }

  function user() {
    return window.PlainlyCloud?.getState?.().user || null;
  }

  function randomCode(len = 7) {
    let out = "";
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    return out;
  }

  async function ensurePublicProfile() {
    const c = client();
    const u = user();
    if (!c || !u) return null;

    const { data: existing, error: readErr } = await c
      .from("plainly_profiles")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (existing) {
      const localName = window.PlainlyStore.loadProfile().name;
      const display =
        localName ||
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        existing.display_name ||
        u.email?.split("@")[0] ||
        "Friend";
      if (display && display !== existing.display_name) {
        const { data, error } = await c
          .from("plainly_profiles")
          .update({
            display_name: display,
            avatar_url: u.user_metadata?.avatar_url || existing.avatar_url || "",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", u.id)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      }
      return existing;
    }

    for (let attempt = 0; attempt < 6; attempt++) {
      const friend_code = randomCode(7);
      const display =
        window.PlainlyStore.loadProfile().name ||
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split("@")[0] ||
        "Friend";
      const { data, error } = await c
        .from("plainly_profiles")
        .insert({
          user_id: u.id,
          display_name: display,
          friend_code,
          avatar_url: u.user_metadata?.avatar_url || "",
        })
        .select("*")
        .single();
      if (!error) return data;
      if (!String(error.message || "").toLowerCase().includes("duplicate")) {
        throw error;
      }
    }
    throw new Error("Could not create a friend code. Try again.");
  }

  async function getMyProfile() {
    return ensurePublicProfile();
  }

  async function lookupByCode(code) {
    const c = client();
    if (!c) throw new Error("Sign in required");
    const normalized = String(code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (normalized.length < 6) throw new Error("That friend code looks too short.");
    const { data, error } = await c
      .from("plainly_profiles")
      .select("user_id, display_name, friend_code, avatar_url")
      .eq("friend_code", normalized)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function listConnections() {
    const c = client();
    const u = user();
    if (!c || !u) return [];

    const { data, error } = await c
      .from("plainly_connections")
      .select("id, requester_id, addressee_id, status, created_at, updated_at")
      .or(`requester_id.eq.${u.id},addressee_id.eq.${u.id}`)
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const rows = data || [];
    const otherIds = [
      ...new Set(
        rows.map((r) => (r.requester_id === u.id ? r.addressee_id : r.requester_id))
      ),
    ];
    let profiles = [];
    if (otherIds.length) {
      const { data: profs, error: pErr } = await c
        .from("plainly_profiles")
        .select("user_id, display_name, friend_code, avatar_url")
        .in("user_id", otherIds);
      if (pErr) throw pErr;
      profiles = profs || [];
    }
    const byId = new Map(profiles.map((p) => [p.user_id, p]));

    return rows.map((r) => {
      const otherId = r.requester_id === u.id ? r.addressee_id : r.requester_id;
      const other = byId.get(otherId) || {
        user_id: otherId,
        display_name: "Someone",
        friend_code: "",
      };
      return {
        ...r,
        other,
        direction: r.requester_id === u.id ? "outgoing" : "incoming",
      };
    });
  }

  async function requestByCode(code) {
    const c = client();
    const u = user();
    if (!c || !u) throw new Error("Sign in to connect.");
    const target = await lookupByCode(code);
    if (!target) throw new Error("No profile found for that friend code.");
    if (target.user_id === u.id) throw new Error("That’s your own code.");

    const { data: existing } = await c
      .from("plainly_connections")
      .select("id, status, requester_id, addressee_id")
      .or(
        `and(requester_id.eq.${u.id},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${u.id})`
      )
      .maybeSingle();

    if (existing) {
      if (existing.status === "declined") {
        const { data, error } = await c
          .from("plainly_connections")
          .update({
            requester_id: u.id,
            addressee_id: target.user_id,
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      }
      return existing;
    }

    const { data, error } = await c
      .from("plainly_connections")
      .insert({
        requester_id: u.id,
        addressee_id: target.user_id,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function setStatus(connectionId, status) {
    const c = client();
    const u = user();
    if (!c || !u) throw new Error("Sign in required");
    const { data, error } = await c
      .from("plainly_connections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", connectionId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function getConnection(connectionId) {
    const list = await listConnections();
    return list.find((x) => x.id === connectionId) || null;
  }

  async function getStances(connectionId) {
    const c = client();
    if (!c) throw new Error("Sign in required");
    const { data, error } = await c
      .from("plainly_pair_stances")
      .select("*")
      .eq("connection_id", connectionId);
    if (error) throw error;
    return data || [];
  }

  async function saveStance(connectionId, stance) {
    const c = client();
    const u = user();
    if (!c || !u) throw new Error("Sign in required");
    const payload = {
      connection_id: connectionId,
      from_user_id: u.id,
      value: stance.value,
      zone_id: stance.zone_id,
      subtype_id: stance.subtype_id,
      note: stance.note || "",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await c
      .from("plainly_pair_stances")
      .upsert(payload, { onConflict: "connection_id,from_user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  function inviteUrl(friendCode) {
    return `${location.origin}${location.pathname}#invite/${friendCode}`;
  }

  return {
    ensurePublicProfile,
    getMyProfile,
    lookupByCode,
    listConnections,
    requestByCode,
    setStatus,
    getConnection,
    getStances,
    saveStance,
    inviteUrl,
  };
})();

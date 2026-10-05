window.PlainlyTogether = (() => {
  const { escapeHtml, formatDate, copyText } = window.PlainlyUtils;

  const zoneColors = {
    enemies: "#455868",
    negative: "#6a5f55",
    neutral: "#4f645c",
    positive: "#2f6f5e",
    love: "#7a4554",
  };

  function zones() {
    return window.PLAINLY.zones;
  }

  function zoneAt(v) {
    const list = zones();
    return list.find((z) => v >= z.range[0] && v <= z.range[1]) || list[list.length - 1];
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function subtypeLabel(zoneId, subtypeId) {
    const zone = zones().find((z) => z.id === zoneId);
    const sub = zone?.subtypes?.find((s) => s.id === subtypeId);
    return sub?.label || subtypeId || "—";
  }

  function authGate(root, message) {
    const state = window.PlainlyCloud?.getState?.() || {
      configured: false,
      status: "loading",
    };

    // Still booting — don't claim config is missing yet.
    if (
      state.status === "loading" ||
      state.status === "idle" ||
      state.status === "syncing"
    ) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Together</p>
          <h1 class="page-title">Loading…</h1>
          <p class="page-lede">Checking cloud sync and sign-in.</p>
        </section>`;
      return false;
    }

    if (!state.configured) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Together</p>
          <h1 class="page-title">Private spectra</h1>
          <p class="page-lede">Cloud sync isn’t configured yet. Try a hard refresh; if it sticks, the Netlify config function may be down.</p>
        </section>`;
      return false;
    }
    if (!(state.user || state.status === "signed_in")) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Together</p>
          <h1 class="page-title">Add people you trust</h1>
          <p class="page-lede">${escapeHtml(
            message ||
              "Sign in with Google to share invite links and keep a private spectrum between you."
          )}</p>
        </section>
        <section class="profile-shell">
          <button type="button" class="btn-google" id="together-google">
            <span class="btn-google-mark" aria-hidden="true">G</span>
            Continue with Google
          </button>
          <p class="crush-next"><a class="text-link" href="#profile">Open profile</a></p>
        </section>`;
      document.getElementById("together-google")?.addEventListener("click", () => {
        window.PlainlyCloud.signInWithGoogle();
      });
      return false;
    }
    return true;
  }

  async function showInvite(code) {
    const root = document.getElementById("view-together");
    document.documentElement.style.setProperty("--zone", "#3d6b7a");
    if (!authGate(root, "Sign in to accept this invite and connect.")) return;

    root.innerHTML = `
      <section class="page-hero">
        <p class="zone-kicker">Invite</p>
        <h1 class="page-title">Connecting…</h1>
      </section>`;

    try {
      const profile = await window.PlainlyConnections.lookupByCode(code);
      if (!profile) {
        root.innerHTML = `
          <section class="page-hero">
            <p class="zone-kicker">Invite</p>
            <h1 class="page-title">Invite not found</h1>
            <p class="page-lede">That friend code doesn’t match anyone yet.</p>
          </section>`;
        return;
      }
      const me = window.PlainlyCloud.getState().user;
      if (profile.user_id === me.id) {
        root.innerHTML = `
          <section class="page-hero">
            <p class="zone-kicker">Invite</p>
            <h1 class="page-title">That’s your link</h1>
            <p class="page-lede">Send it to someone else so they can request a connection with you.</p>
            <p class="crush-next"><a class="text-link" href="#together">Back to Together</a></p>
          </section>`;
        return;
      }

      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Invite</p>
          <h1 class="page-title">Connect with ${escapeHtml(profile.display_name)}?</h1>
          <p class="page-lede">
            You’ll send a request. They’ll accept before a private spectrum opens between you.
          </p>
        </section>
        <section class="profile-shell">
          <p class="journal-hint">Friend code: <strong>${escapeHtml(
            profile.friend_code
          )}</strong></p>
          <div class="journal-actions">
            <button type="button" class="btn-primary" id="invite-send">Send request</button>
            <a class="btn-quiet" href="#together">Cancel</a>
          </div>
          <p class="form-error" id="invite-error" hidden></p>
        </section>`;

      document.getElementById("invite-send").addEventListener("click", async () => {
        const err = document.getElementById("invite-error");
        try {
          const conn = await window.PlainlyConnections.requestByCode(code);
          if (conn.status === "accepted") {
            location.hash = `#together/${conn.id}`;
            return;
          }
          location.hash = "#together";
        } catch (e) {
          err.hidden = false;
          err.textContent = e.message || String(e);
        }
      });
    } catch (e) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Invite</p>
          <h1 class="page-title">Couldn’t open invite</h1>
          <p class="page-lede">${escapeHtml(e.message || String(e))}</p>
          <p class="crush-next">
            If this mentions a missing table, run <code>supabase/connections.sql</code> in Supabase.
          </p>
        </section>`;
    }
  }

  async function showList() {
    const root = document.getElementById("view-together");
    document.documentElement.style.setProperty("--zone", "#3d6b7a");
    if (!authGate(root)) return;

    root.innerHTML = `
      <section class="page-hero">
        <p class="zone-kicker">Together</p>
        <h1 class="page-title">Private spectra</h1>
        <p class="page-lede">Add people by invite. Keep a living spectrum that exists only between you.</p>
      </section>
      <section class="profile-shell" id="together-body">
        <p class="profile-empty">Loading…</p>
      </section>`;

    const body = document.getElementById("together-body");
    try {
      await window.PlainlyConnections.ensurePublicProfile();
      const me = await window.PlainlyConnections.getMyProfile();
      const connections = await window.PlainlyConnections.listConnections();
      const pendingIn = connections.filter(
        (c) => c.status === "pending" && c.direction === "incoming"
      );
      const pendingOut = connections.filter(
        (c) => c.status === "pending" && c.direction === "outgoing"
      );
      const accepted = connections.filter((c) => c.status === "accepted");
      const invite = window.PlainlyConnections.inviteUrl(me.friend_code);

      body.innerHTML = `
        <aside class="auth-card">
          <p class="zone-kicker">Your invite</p>
          <h2 class="subtype-title">Friend code ${escapeHtml(me.friend_code)}</h2>
          <p class="subtype-blurb">Share this link. They sign in, send a request, and you accept.</p>
          <div class="share-row">
            <code class="share-url" id="together-invite-url">${escapeHtml(invite)}</code>
            <button type="button" class="btn-primary" id="together-copy-invite">Copy invite</button>
          </div>
        </aside>

        <form class="profile-inline-form" id="together-add-form">
          <p class="zone-kicker">Add with a code</p>
          <label class="field">
            <span>Their friend code</span>
            <input name="code" maxlength="12" required placeholder="e.g. AB12CD3" autocomplete="off" style="text-transform:uppercase" />
          </label>
          <button type="submit" class="btn-primary">Send request</button>
          <p class="form-error" id="together-add-error" hidden></p>
        </form>

        ${
          pendingIn.length
            ? `<div class="together-block">
                <h3 class="journal-list-title">Requests for you</h3>
                <div class="profile-list">${pendingIn
                  .map(
                    (c) => `
                  <article class="profile-list-item" data-id="${escapeHtml(c.id)}">
                    <header class="journal-entry-head">
                      <div>
                        <h3 class="journal-entry-name">${escapeHtml(
                          c.other.display_name
                        )}</h3>
                        <p class="journal-entry-title">Wants to connect</p>
                      </div>
                      <div class="journal-entry-actions">
                        <button type="button" class="btn-primary" data-action="accept">Accept</button>
                        <button type="button" class="btn-quiet danger" data-action="decline">Decline</button>
                      </div>
                    </header>
                  </article>`
                  )
                  .join("")}</div>
              </div>`
            : ""
        }

        ${
          pendingOut.length
            ? `<div class="together-block">
                <h3 class="journal-list-title">Waiting on them</h3>
                <div class="profile-list">${pendingOut
                  .map(
                    (c) => `
                  <article class="profile-list-item">
                    <h3 class="journal-entry-name">${escapeHtml(
                      c.other.display_name
                    )}</h3>
                    <p class="journal-entry-title">Request pending</p>
                  </article>`
                  )
                  .join("")}</div>
              </div>`
            : ""
        }

        <div class="together-block">
          <h3 class="journal-list-title">Connected</h3>
          ${
            accepted.length
              ? `<div class="profile-list">${accepted
                  .map(
                    (c) => `
                <article class="profile-list-item">
                  <header class="journal-entry-head">
                    <div>
                      <h3 class="journal-entry-name">${escapeHtml(
                        c.other.display_name
                      )}</h3>
                      <p class="journal-entry-title">Private spectrum</p>
                    </div>
                    <a class="btn-primary" href="#together/${escapeHtml(
                      c.id
                    )}">Open</a>
                  </header>
                </article>`
                  )
                  .join("")}</div>`
              : emptyConnected()
          }
        </div>
      `;

      document.getElementById("together-copy-invite")?.addEventListener("click", async (e) => {
        const ok = await copyText(invite);
        e.currentTarget.textContent = ok ? "Copied" : "Copy from above";
      });

      document.getElementById("together-add-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const err = document.getElementById("together-add-error");
        err.hidden = true;
        try {
          await window.PlainlyConnections.requestByCode(form.code.value);
          await showList();
        } catch (e) {
          err.hidden = false;
          err.textContent = e.message || String(e);
        }
      });

      body.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.closest("[data-id]")?.dataset.id;
          if (!id) return;
          try {
            await window.PlainlyConnections.setStatus(
              id,
              btn.dataset.action === "accept" ? "accepted" : "declined"
            );
            if (btn.dataset.action === "accept") location.hash = `#together/${id}`;
            else await showList();
          } catch (e) {
            alert(e.message || String(e));
          }
        });
      });
    } catch (e) {
      body.innerHTML = `
        <p class="form-error">${escapeHtml(e.message || String(e))}</p>
        <p class="journal-hint">
          First-time setup: run <code>supabase/connections.sql</code> in the Supabase SQL editor, then refresh.
        </p>`;
    }
  }

  function emptyConnected() {
    return `<p class="profile-empty">No connections yet. Share your invite or enter their friend code.</p>`;
  }

  async function showPair(connectionId) {
    const root = document.getElementById("view-together");
    document.documentElement.style.setProperty("--zone", "#3d6b7a");
    if (!authGate(root)) return;

    root.innerHTML = `
      <section class="page-hero">
        <p class="zone-kicker">Together</p>
        <h1 class="page-title">Loading…</h1>
      </section>`;

    try {
      const conn = await window.PlainlyConnections.getConnection(connectionId);
      if (!conn || conn.status !== "accepted") {
        root.innerHTML = `
          <section class="page-hero">
            <p class="zone-kicker">Together</p>
            <h1 class="page-title">Connection not available</h1>
            <p class="page-lede">It may still be pending, or the invite was declined.</p>
            <p class="crush-next"><a class="text-link" href="#together">Back</a></p>
          </section>`;
        return;
      }

      const me = window.PlainlyCloud.getState().user;
      const stances = await window.PlainlyConnections.getStances(connectionId);
      const mine = stances.find((s) => s.from_user_id === me.id);
      const theirs = stances.find((s) => s.from_user_id !== me.id);

      let value = Number(mine?.value ?? 50);
      let zone = zoneAt(value);
      let subtypeId = mine?.subtype_id || zone.subtypes[0].id;
      if (!zone.subtypes.some((s) => s.id === subtypeId)) {
        subtypeId = zone.subtypes[0].id;
      }

      const paintPair = () => {
        zone = zoneAt(value);
        if (!zone.subtypes.some((s) => s.id === subtypeId)) {
          subtypeId = zone.subtypes[0].id;
        }
        document.documentElement.style.setProperty(
          "--zone",
          zoneColors[zone.id] || zoneColors.neutral
        );
        const subtype = zone.subtypes.find((s) => s.id === subtypeId);

        root.innerHTML = `
          <section class="page-hero">
            <p class="zone-kicker">With ${escapeHtml(conn.other.display_name)}</p>
            <h1 class="page-title">How I feel</h1>
            <p class="page-lede">This spectrum is only between you two.</p>
          </section>
          <section class="profile-shell pair-shell">
            <p class="crush-next"><a class="text-link" href="#together">← All connections</a></p>

            <div class="pair-theirs">
              <p class="zone-kicker">How they feel about you</p>
              ${
                theirs
                  ? `<h2 class="zone-title">${escapeHtml(
                      zones().find((z) => z.id === theirs.zone_id)?.label ||
                        theirs.zone_id
                    )}</h2>
                     <p class="subtype-blurb">${escapeHtml(
                       subtypeLabel(theirs.zone_id, theirs.subtype_id)
                     )} · updated ${escapeHtml(
                       formatDate(Date.parse(theirs.updated_at) || Date.now())
                     )}</p>`
                  : `<p class="profile-empty">They haven’t set a stance yet.</p>`
              }
            </div>

            <div class="spectrum-block pair-spectrum">
              <div class="spectrum-labels" aria-hidden="true">
                <span>enemies</span>
                <span>love</span>
              </div>
              <div class="spectrum" id="pair-spectrum" role="slider" tabindex="0"
                aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(
                  value
                )}"
                aria-valuetext="${escapeHtml(zone.label)}"
                aria-label="How you feel about ${escapeHtml(conn.other.display_name)}">
                <div class="spectrum-track">
                  <div class="spectrum-fill" id="pair-fill" style="width:${value}%"></div>
                  <div class="spectrum-zones">${zones()
                    .map(() => "<span></span>")
                    .join("")}</div>
                  <div class="spectrum-thumb" id="pair-thumb" style="left:${value}%"></div>
                </div>
              </div>
              <p class="spectrum-now">
                <span class="now-kicker">Standing at</span>
                <span class="now-label" id="pair-now">${escapeHtml(zone.label)}</span>
              </p>
            </div>

            <div class="subtype-row" id="pair-subtypes" role="tablist">
              ${zone.subtypes
                .map(
                  (s) => `
                <button type="button" class="subtype-btn" data-subtype="${s.id}"
                  aria-selected="${s.id === subtypeId}">${escapeHtml(s.label)}</button>`
                )
                .join("")}
            </div>

            <article class="boundary-panel">
              <header class="boundary-header">
                <h3 class="subtype-title">${escapeHtml(subtype.label)}</h3>
                <p class="subtype-blurb">${escapeHtml(subtype.blurb)}</p>
              </header>
              <p class="zone-kicker boundaries-kicker">Boundaries for this stance</p>
              <ol class="boundaries">
                ${subtype.boundaries
                  .map((line) => `<li>${escapeHtml(line)}</li>`)
                  .join("")}
              </ol>
              <div id="pair-extras" class="stance-extras"></div>
            </article>

            <div class="journal-actions">
              <button type="button" class="btn-primary" id="pair-save">Save to our spectrum</button>
              <span class="share-help" id="pair-save-status"></span>
            </div>
          </section>
        `;

        window.PlainlyExtras?.render(document.getElementById("pair-extras"), {
          key: `spectrum:${subtypeId}`,
          showFreedoms: true,
        });

        bindPairControls();
      };

      const persist = async () => {
        const status = document.getElementById("pair-save-status");
        try {
          zone = zoneAt(value);
          await window.PlainlyConnections.saveStance(connectionId, {
            value,
            zone_id: zone.id,
            subtype_id: subtypeId,
          });
          if (status) status.textContent = "Saved";
        } catch (e) {
          if (status) status.textContent = e.message || "Save failed";
        }
      };

      function bindPairControls() {
        const spectrum = document.getElementById("pair-spectrum");
        const fill = document.getElementById("pair-fill");
        const thumb = document.getElementById("pair-thumb");
        const now = document.getElementById("pair-now");
        let dragging = false;

        const applyVisual = (v) => {
          value = clamp(v, 0, 100);
          const nextZone = zoneAt(value);
          fill.style.width = `${value}%`;
          thumb.style.left = `${value}%`;
          spectrum.setAttribute("aria-valuenow", String(Math.round(value)));
          spectrum.setAttribute("aria-valuetext", nextZone.label);
          now.textContent = nextZone.label;
          document.documentElement.style.setProperty(
            "--zone",
            zoneColors[nextZone.id] || zoneColors.neutral
          );
          return nextZone;
        };

        const fromPointer = (event) => {
          const track = spectrum.querySelector(".spectrum-track");
          const rect = track.getBoundingClientRect();
          const x = event.clientX - rect.left;
          return clamp((x / rect.width) * 100, 0, 100);
        };

        spectrum.addEventListener("pointerdown", (event) => {
          dragging = true;
          spectrum.setPointerCapture?.(event.pointerId);
          applyVisual(fromPointer(event));
        });
        spectrum.addEventListener("pointermove", (event) => {
          if (!dragging) return;
          applyVisual(fromPointer(event));
        });
        const end = async (event) => {
          if (!dragging) return;
          dragging = false;
          try {
            spectrum.releasePointerCapture?.(event.pointerId);
          } catch (_) {}
          const nextZone = zoneAt(value);
          const zoneChanged = nextZone.id !== zone.id;
          zone = nextZone;
          if (!zone.subtypes.some((s) => s.id === subtypeId)) {
            subtypeId = zone.subtypes[0].id;
          }
          if (zoneChanged) paintPair();
          await persist();
        };
        spectrum.addEventListener("pointerup", end);
        spectrum.addEventListener("pointercancel", end);

        document.getElementById("pair-subtypes")?.addEventListener("click", async (event) => {
          const btn = event.target.closest("[data-subtype]");
          if (!btn) return;
          subtypeId = btn.dataset.subtype;
          paintPair();
          await persist();
        });

        document.getElementById("pair-save")?.addEventListener("click", persist);
      }

      paintPair();
    } catch (e) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="zone-kicker">Together</p>
          <h1 class="page-title">Couldn’t open this pair</h1>
          <p class="page-lede">${escapeHtml(e.message || String(e))}</p>
        </section>`;
    }
  }

  let listening = false;
  let lastHash = "";
  let lastAuthKey = "";

  async function show(hashRaw) {
    lastHash = String(hashRaw || location.hash || "");
    const raw = lastHash.replace(/^#/, "").trim();
    const parts = raw.split("/").filter(Boolean);

    if (!listening && window.PlainlyCloud?.onChange) {
      listening = true;
      window.PlainlyCloud.onChange((state) => {
        const view = document.getElementById("view-together");
        if (!view || view.hidden) return;
        const key = `${state.configured}:${state.status}:${state.user?.id || ""}`;
        // Ignore routine sync ticks; only re-render on auth/config changes.
        if (key === lastAuthKey && state.status !== "loading") return;
        if (state.status === "syncing" && lastAuthKey.includes("signed_in")) return;
        lastAuthKey = key;
        show(location.hash);
      });
    }

    const state = window.PlainlyCloud?.getState?.();
    if (state) {
      lastAuthKey = `${state.configured}:${state.status}:${state.user?.id || ""}`;
    }

    if (parts[0] === "invite" && parts[1]) {
      await showInvite(parts[1]);
      return;
    }
    if (parts[0] === "together" && parts[1]) {
      await showPair(parts[1]);
      return;
    }
    await showList();
  }

  return { show };
})();

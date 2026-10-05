window.PlainlyProfile = (() => {
  const {
    escapeHtml,
    formatDate,
    uid,
    encodePayload,
    decodePayload,
    copyText,
  } = window.PlainlyUtils;

  let activeSection = "overview";
  let bound = false;

  const SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "people", label: "People" },
    { id: "journal", label: "Journal" },
    { id: "crushes", label: "Crush notes" },
    { id: "dating", label: "Dating" },
    { id: "messages", label: "Messages" },
  ];

  function replyLabel(id) {
    return (
      window.PLAINLY.crush.replies.find((r) => r.id === id)?.label || id || "—"
    );
  }

  function setTone() {
    document.documentElement.style.setProperty("--zone", "#3d6b7a");
  }

  function emptyLine(text) {
    return `<p class="profile-empty">${escapeHtml(text)}</p>`;
  }

  function renderAuthCard() {
    const state = window.PlainlyCloud?.getState?.() || {
      configured: false,
      status: "signed_out",
      email: "",
      name: "",
      lastError: "",
    };

    if (!state.configured) {
      return `
        <aside class="auth-card">
          <p class="zone-kicker">Cloud sync</p>
          <h2 class="subtype-title">Sign in across devices</h2>
          <p class="subtype-blurb">
            Google sign-in is almost ready. Add Supabase keys in Netlify to turn it on
            (see <code>CLOUD-SETUP.md</code>).
          </p>
        </aside>`;
    }

    if (state.status === "loading" || state.status === "syncing") {
      return `
        <aside class="auth-card">
          <p class="zone-kicker">Cloud sync</p>
          <h2 class="subtype-title">${
            state.status === "syncing" ? "Syncing your Plainly…" : "Checking sign-in…"
          }</h2>
        </aside>`;
    }

    if (state.user || state.status === "signed_in") {
      return `
        <aside class="auth-card is-signed-in">
          <div class="auth-signed">
            <div>
              <p class="zone-kicker">Signed in with Google</p>
              <h2 class="subtype-title">${escapeHtml(state.name || "You")}</h2>
              <p class="subtype-blurb">${escapeHtml(state.email || "")}</p>
              <p class="journal-hint">Profile, journal, and extras sync to this account.</p>
            </div>
            <button type="button" class="btn-quiet" id="auth-sign-out">Sign out</button>
          </div>
          ${
            state.lastError
              ? `<p class="form-error">${escapeHtml(state.lastError)}</p>`
              : ""
          }
        </aside>`;
    }

    return `
      <aside class="auth-card">
        <p class="zone-kicker">Cloud sync</p>
        <h2 class="subtype-title">Use Plainly on any device</h2>
        <p class="subtype-blurb">
          Sign in with Google to save your profile, journal, crush notes, and freedoms in the cloud.
        </p>
        <button type="button" class="btn-google" id="auth-google">
          <span class="btn-google-mark" aria-hidden="true">G</span>
          Continue with Google
        </button>
        ${
          state.lastError
            ? `<p class="form-error">${escapeHtml(state.lastError)}</p>`
            : ""
        }
      </aside>`;
  }

  function renderOverview(profile, journal) {
    const counts = {
      friends: profile.people.filter((p) => p.role === "friend").length,
      crushes: profile.people.filter((p) => p.role === "crush").length,
      enemies: profile.people.filter((p) => p.role === "enemy").length,
      journal: journal.length,
      notes: profile.crushNotes.length,
      dating: profile.dating.length,
      messages: profile.messages.length,
    };

    return `
      <div class="profile-section">
        <form class="profile-identity" id="profile-identity">
          <label class="field">
            <span>Display name</span>
            <input id="profile-name" name="name" maxlength="60" value="${escapeHtml(
              profile.name
            )}" placeholder="What should we call you?" autocomplete="nickname" />
          </label>
          <label class="field">
            <span>Tagline <em>(optional)</em></span>
            <input id="profile-tagline" name="tagline" maxlength="140" value="${escapeHtml(
              profile.tagline
            )}" placeholder="How you show up in friendships and dating" />
          </label>
          <button type="submit" class="btn-primary">Save profile</button>
        </form>

        <div class="profile-stats" aria-label="Profile summary">
          <div class="profile-stat"><strong>${counts.friends}</strong><span>Friends</span></div>
          <div class="profile-stat"><strong>${counts.crushes}</strong><span>Crushes</span></div>
          <div class="profile-stat"><strong>${counts.enemies}</strong><span>Enemies</span></div>
          <div class="profile-stat"><strong>${counts.journal}</strong><span>Journal</span></div>
          <div class="profile-stat"><strong>${counts.notes}</strong><span>Crush notes</span></div>
          <div class="profile-stat"><strong>${counts.dating}</strong><span>Date ratings</span></div>
          <div class="profile-stat"><strong>${counts.messages}</strong><span>Messages</span></div>
        </div>
        <p class="journal-hint">
          Everything here stays on this device. Clear site data and it’s gone.
        </p>
      </div>
    `;
  }

  function renderPeople(profile) {
    const roles = [
      { id: "friend", title: "Friends", hint: "People you keep close." },
      { id: "crush", title: "Crushes", hint: "Interest with a pulse." },
      { id: "enemy", title: "Enemies", hint: "Hard distance. Named plainly." },
    ];

    return `
      <div class="profile-section">
        <form class="profile-inline-form" id="people-form">
          <div class="journal-form-grid">
            <label class="field">
              <span>Name</span>
              <input name="name" maxlength="80" required placeholder="Who" autocomplete="off" />
            </label>
            <label class="field">
              <span>List</span>
              <select name="role">
                <option value="friend">Friend</option>
                <option value="crush">Crush</option>
                <option value="enemy">Enemy</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Note <em>(optional)</em></span>
            <input name="note" maxlength="200" placeholder="A short line about them" />
          </label>
          <button type="submit" class="btn-primary">Add to list</button>
        </form>

        <div class="people-columns">
          ${roles
            .map((role) => {
              const items = profile.people
                .filter((p) => p.role === role.id)
                .sort((a, b) => a.name.localeCompare(b.name));
              return `
              <section class="people-col">
                <header class="people-col-head">
                  <h3>${role.title}</h3>
                  <p>${escapeHtml(role.hint)}</p>
                </header>
                ${
                  items.length
                    ? `<ul class="people-list">${items
                        .map(
                          (p) => `
                      <li data-id="${escapeHtml(p.id)}">
                        <div>
                          <strong>${escapeHtml(p.name)}</strong>
                          ${
                            p.note
                              ? `<span>${escapeHtml(p.note)}</span>`
                              : ""
                          }
                        </div>
                        <button type="button" class="btn-quiet danger" data-action="delete-person">Remove</button>
                      </li>`
                        )
                        .join("")}</ul>`
                    : emptyLine("Nobody here yet.")
                }
              </section>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderJournal(journal) {
    const entries = [...journal].sort((a, b) => b.updatedAt - a.updatedAt);
    return `
      <div class="profile-section">
        <div class="profile-section-head">
          <p class="subtype-blurb">Pulled from your Friends journal.</p>
          <a class="text-link" href="#journal">Open journal</a>
        </div>
        ${
          entries.length
            ? `<div class="journal-list">${entries
                .slice(0, 20)
                .map(
                  (entry) => `
              <article class="journal-entry">
                <header class="journal-entry-head">
                  <div>
                    <p class="journal-entry-meta">
                      <span>${escapeHtml(
                        entry.kind === "date"
                          ? "Date"
                          : entry.kind === "other"
                            ? "Other"
                            : "Friend"
                      )}</span>
                      <span aria-hidden="true">·</span>
                      <time>${escapeHtml(formatDate(entry.updatedAt))}</time>
                    </p>
                    <h3 class="journal-entry-name">${escapeHtml(entry.name)}</h3>
                    ${
                      entry.title
                        ? `<p class="journal-entry-title">${escapeHtml(
                            entry.title
                          )}</p>`
                        : ""
                    }
                  </div>
                </header>
                <p class="journal-entry-body">${escapeHtml(entry.body).replaceAll(
                  "\n",
                  "<br />"
                )}</p>
              </article>`
                )
                .join("")}</div>`
            : `${emptyLine("No journal entries yet.")}
               <p><a class="text-link" href="#journal">Write your first note</a></p>`
        }
      </div>
    `;
  }

  function renderCrushNotes(profile) {
    const notes = profile.crushNotes;
    return `
      <div class="profile-section">
        <div class="profile-section-head">
          <p class="subtype-blurb">Notes you’ve sent, opened, or answered.</p>
          <a class="text-link" href="#crush">Write a crush note</a>
        </div>
        <form class="profile-inline-form" id="crush-keep-form">
          <p class="zone-kicker">Keep a note by link</p>
          <label class="field">
            <span>Crush note URL</span>
            <input name="url" required placeholder="Paste a plainly crush link" />
          </label>
          <button type="submit" class="btn-primary">Save to profile</button>
        </form>
        ${
          notes.length
            ? `<div class="profile-list">${notes
                .map((n) => {
                  const title =
                    n.direction === "sent"
                      ? "Sent"
                      : n.direction === "reply"
                        ? "Reply"
                        : "Received";
                  const detail = n.reply
                    ? replyLabel(n.reply)
                    : window.PLAINLY.crush.sendMessage;
                  return `
                <article class="profile-list-item" data-id="${escapeHtml(n.id)}">
                  <header class="journal-entry-head">
                    <div>
                      <p class="journal-entry-meta">
                        <span>${escapeHtml(title)}</span>
                        <span aria-hidden="true">·</span>
                        <time>${escapeHtml(formatDate(n.savedAt))}</time>
                      </p>
                      <h3 class="journal-entry-name">${escapeHtml(detail)}</h3>
                      <p class="journal-entry-title">
                        ${escapeHtml(n.from || "Anonymous")} → ${escapeHtml(
                          n.to || "someone"
                        )}
                      </p>
                    </div>
                    <div class="journal-entry-actions">
                      ${
                        n.url
                          ? `<a class="btn-quiet" href="${escapeHtml(
                              n.url
                            )}">Open</a>`
                          : ""
                      }
                      <button type="button" class="btn-quiet danger" data-action="delete-crush">Delete</button>
                    </div>
                  </header>
                  ${
                    n.ps
                      ? `<p class="journal-entry-body">${escapeHtml(n.ps)}</p>`
                      : ""
                  }
                </article>`;
                })
                .join("")}</div>`
            : emptyLine("No saved crush notes yet.")
        }
      </div>
    `;
  }

  function stars(rating) {
    const n = Math.max(1, Math.min(5, Number(rating) || 1));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function renderDating(profile) {
    const items = [...profile.dating].sort((a, b) => b.createdAt - a.createdAt);
    return `
      <div class="profile-section">
        <p class="subtype-blurb">Rate dating experiences — privately, for your own pattern-spotting.</p>
        <form class="profile-inline-form" id="dating-form">
          <div class="journal-form-grid">
            <label class="field">
              <span>With</span>
              <input name="withName" maxlength="80" required placeholder="Name" autocomplete="off" />
            </label>
            <label class="field">
              <span>Rating</span>
              <select name="rating">
                <option value="5">★★★★★ Great</option>
                <option value="4">★★★★☆ Good</option>
                <option value="3" selected>★★★☆☆ Mixed</option>
                <option value="2">★★☆☆☆ Rough</option>
                <option value="1">★☆☆☆☆ Nope</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>What happened <em>(optional)</em></span>
            <textarea name="note" rows="3" maxlength="2000" placeholder="What felt good, weird, or worth remembering…"></textarea>
          </label>
          <button type="submit" class="btn-primary">Save rating</button>
        </form>
        ${
          items.length
            ? `<div class="profile-list">${items
                .map(
                  (d) => `
              <article class="profile-list-item" data-id="${escapeHtml(d.id)}">
                <header class="journal-entry-head">
                  <div>
                    <p class="journal-entry-meta">
                      <span class="dating-stars" aria-label="${d.rating} of 5">${stars(
                        d.rating
                      )}</span>
                      <span aria-hidden="true">·</span>
                      <time>${escapeHtml(formatDate(d.createdAt))}</time>
                    </p>
                    <h3 class="journal-entry-name">${escapeHtml(d.withName)}</h3>
                  </div>
                  <button type="button" class="btn-quiet danger" data-action="delete-dating">Delete</button>
                </header>
                ${
                  d.note
                    ? `<p class="journal-entry-body">${escapeHtml(d.note).replaceAll(
                        "\n",
                        "<br />"
                      )}</p>`
                    : ""
                }
              </article>`
                )
                .join("")}</div>`
            : emptyLine("No dating ratings yet.")
        }
      </div>
    `;
  }

  function renderMessages(profile) {
    const items = [...profile.messages].sort((a, b) => b.createdAt - a.createdAt);
    return `
      <div class="profile-section">
        <p class="subtype-blurb">Craft a unique message for a friend — keep it here, or send a private link.</p>
        <form class="profile-inline-form" id="message-form">
          <label class="field">
            <span>To</span>
            <input name="to" maxlength="80" required placeholder="Friend’s name" autocomplete="off" />
          </label>
          <label class="field">
            <span>From <em>(optional)</em></span>
            <input name="from" maxlength="60" placeholder="Your name" value="${escapeHtml(
              profile.name || ""
            )}" />
          </label>
          <label class="field">
            <span>Message</span>
            <textarea name="body" rows="5" maxlength="4000" required placeholder="Something only you would say to them…"></textarea>
          </label>
          <button type="submit" class="btn-primary">Save message</button>
        </form>
        ${
          items.length
            ? `<div class="profile-list">${items
                .map((m) => {
                  const hash = `#message/m/${encodePayload({
                    v: 1,
                    to: m.to,
                    from: m.from || "",
                    body: m.body,
                  })}`;
                  const url = `${location.origin}${location.pathname}${hash}`;
                  return `
                <article class="profile-list-item" data-id="${escapeHtml(m.id)}" data-url="${escapeHtml(
                    url
                  )}" data-body-encoded="${encodeURIComponent(m.body)}">
                  <header class="journal-entry-head">
                    <div>
                      <p class="journal-entry-meta">
                        <span>For ${escapeHtml(m.to)}</span>
                        <span aria-hidden="true">·</span>
                        <time>${escapeHtml(formatDate(m.createdAt))}</time>
                      </p>
                      <h3 class="journal-entry-name">${escapeHtml(
                        m.from ? `From ${m.from}` : "Unsigned"
                      )}</h3>
                    </div>
                    <div class="journal-entry-actions">
                      <button type="button" class="btn-quiet" data-action="copy-message">Copy text</button>
                      <button type="button" class="btn-quiet" data-action="copy-message-link">Copy link</button>
                      <button type="button" class="btn-quiet danger" data-action="delete-message">Delete</button>
                    </div>
                  </header>
                  <p class="journal-entry-body">${escapeHtml(m.body).replaceAll(
                    "\n",
                    "<br />"
                  )}</p>
                </article>`;
                })
                .join("")}</div>`
            : emptyLine("No crafted messages yet.")
        }
      </div>
    `;
  }

  function renderMessageOpen(payload) {
    setTone();
    return `
      <section class="page-hero">
        <p class="zone-kicker">A message for you</p>
        <h1 class="page-title">${escapeHtml(payload.to ? `Hey, ${payload.to}` : "Hey")}</h1>
        <p class="page-lede">${
          payload.from
            ? `From ${escapeHtml(payload.from)}`
            : "Someone wanted you to have this."
        }</p>
      </section>
      <section class="crush-shell">
        <article class="friend-message">
          <p>${escapeHtml(payload.body || "").replaceAll("\n", "<br />")}</p>
        </article>
        <p class="crush-next">
          <a class="text-link" href="#profile/messages">Back to your messages</a>
          ·
          <a class="text-link" href="#profile">Open profile</a>
        </p>
      </section>
    `;
  }

  function sectionContent(section, profile, journal) {
    switch (section) {
      case "people":
        return renderPeople(profile);
      case "journal":
        return renderJournal(journal);
      case "crushes":
        return renderCrushNotes(profile);
      case "dating":
        return renderDating(profile);
      case "messages":
        return renderMessages(profile);
      default:
        return renderOverview(profile, journal);
    }
  }

  function paint() {
    const root = document.getElementById("view-profile");
    const hash = location.hash.replace(/^#/, "");
    const parts = hash.split("/").filter(Boolean);

    // Shared message open: #message/m/PAYLOAD
    if (parts[0] === "message" && parts[1] === "m" && parts[2]) {
      const payload = decodePayload(parts[2]);
      root.innerHTML = payload
        ? renderMessageOpen(payload)
        : `<section class="page-hero"><h1 class="page-title">Message not found</h1></section>`;
      return;
    }

    if (parts[0] === "profile" && parts[1] && SECTIONS.some((s) => s.id === parts[1])) {
      activeSection = parts[1];
    }

    const profile = window.PlainlyStore.loadProfile();
    const journal = window.PlainlyStore.loadJournal();
    const displayName = profile.name || "Your profile";

    root.innerHTML = `
      <section class="page-hero profile-hero">
        <p class="zone-kicker">Profile</p>
        <h1 class="page-title">${escapeHtml(displayName)}</h1>
        <p class="page-lede">${escapeHtml(
          profile.tagline ||
            "Friends, crushes, enemies, notes, and the messages you mean."
        )}</p>
      </section>

      <section class="profile-shell">
        ${renderAuthCard()}
        <div class="subtype-row profile-tabs" role="tablist" aria-label="Profile sections">
          ${SECTIONS.map(
            (s) => `
            <button type="button" class="subtype-btn" role="tab" data-section="${
              s.id
            }" aria-selected="${s.id === activeSection}">${escapeHtml(
              s.label
            )}</button>`
          ).join("")}
        </div>
        <div id="profile-panel">${sectionContent(
          activeSection,
          profile,
          journal
        )}</div>
      </section>
    `;

    bindPanel();
    bindAuth();
  }

  function bindAuth() {
    document.getElementById("auth-google")?.addEventListener("click", () => {
      window.PlainlyCloud?.signInWithGoogle?.();
    });
    document.getElementById("auth-sign-out")?.addEventListener("click", () => {
      window.PlainlyCloud?.signOut?.();
    });
  }

  function goSection(id) {
    activeSection = id;
    history.replaceState(null, "", `#profile/${id}`);
    paint();
  }

  function bindPanel() {
    const root = document.getElementById("view-profile");

    root.querySelectorAll("[data-section]").forEach((btn) => {
      btn.addEventListener("click", () => goSection(btn.dataset.section));
    });

    const identity = root.querySelector("#profile-identity");
    identity?.addEventListener("submit", (event) => {
      event.preventDefault();
      window.PlainlyStore.updateProfile((p) => {
        p.name = identity.name.value.trim();
        p.tagline = identity.tagline.value.trim();
        return p;
      });
      paint();
    });

    const peopleForm = root.querySelector("#people-form");
    peopleForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = peopleForm.name.value.trim();
      if (!name) return;
      window.PlainlyStore.updateProfile((p) => {
        p.people.unshift({
          id: uid(),
          name,
          role: peopleForm.role.value,
          note: peopleForm.note.value.trim(),
          createdAt: Date.now(),
        });
        return p;
      });
      paint();
    });

    root.querySelectorAll("[data-action='delete-person']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest("[data-id]")?.dataset.id;
        window.PlainlyStore.updateProfile((p) => {
          p.people = p.people.filter((x) => x.id !== id);
          return p;
        });
        paint();
      });
    });

    const crushKeep = root.querySelector("#crush-keep-form");
    crushKeep?.addEventListener("submit", (event) => {
      event.preventDefault();
      const url = crushKeep.url.value.trim();
      const hashPart = url.includes("#") ? url.split("#")[1] : url.replace(/^#/, "");
      const parts = hashPart.split("/").filter(Boolean);
      const keepError = () => {
        let err = crushKeep.querySelector(".form-error");
        if (!err) {
          err = document.createElement("p");
          err.className = "form-error";
          crushKeep.appendChild(err);
        }
        err.textContent = "That doesn’t look like a readable Plainly crush note link.";
      };
      if (parts[0] !== "crush" || !parts[2]) {
        keepError();
        return;
      }
      const payload = decodePayload(parts[2]);
      if (!payload) {
        keepError();
        return;
      }
      const absolute = url.startsWith("http")
        ? url
        : `${location.origin}${location.pathname}#${hashPart}`;
      window.PlainlyStore.saveCrushNote({
        id: uid(),
        direction: parts[1] === "r" ? "reply" : parts[1] === "n" ? "received" : "sent",
        from: payload.from || "",
        to: payload.to || "",
        ps: payload.ps || "",
        reply: payload.reply || "",
        url: absolute,
        savedAt: Date.now(),
      });
      paint();
    });

    root.querySelectorAll("[data-action='delete-crush']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest("[data-id]")?.dataset.id;
        window.PlainlyStore.updateProfile((p) => {
          p.crushNotes = p.crushNotes.filter((x) => x.id !== id);
          return p;
        });
        paint();
      });
    });

    const datingForm = root.querySelector("#dating-form");
    datingForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const withName = datingForm.withName.value.trim();
      if (!withName) return;
      window.PlainlyStore.updateProfile((p) => {
        p.dating.unshift({
          id: uid(),
          withName,
          rating: Number(datingForm.rating.value) || 3,
          note: datingForm.note.value.trim(),
          createdAt: Date.now(),
        });
        return p;
      });
      paint();
    });

    root.querySelectorAll("[data-action='delete-dating']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest("[data-id]")?.dataset.id;
        window.PlainlyStore.updateProfile((p) => {
          p.dating = p.dating.filter((x) => x.id !== id);
          return p;
        });
        paint();
      });
    });

    const messageForm = root.querySelector("#message-form");
    messageForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const to = messageForm.to.value.trim();
      const body = messageForm.body.value.trim();
      if (!to || !body) return;
      window.PlainlyStore.updateProfile((p) => {
        p.messages.unshift({
          id: uid(),
          to,
          from: messageForm.from.value.trim(),
          body,
          createdAt: Date.now(),
        });
        return p;
      });
      paint();
    });

    root.querySelectorAll("[data-action='delete-message']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest("[data-id]")?.dataset.id;
        window.PlainlyStore.updateProfile((p) => {
          p.messages = p.messages.filter((x) => x.id !== id);
          return p;
        });
        paint();
      });
    });

    root.querySelectorAll("[data-action='copy-message']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const item = btn.closest("[data-body-encoded]");
        const text = decodeURIComponent(item?.dataset.bodyEncoded || "");
        const ok = await copyText(text);
        btn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => {
          btn.textContent = "Copy text";
        }, 1400);
      });
    });

    root.querySelectorAll("[data-action='copy-message-link']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const item = btn.closest("[data-url]");
        const ok = await copyText(item.dataset.url || "");
        btn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => {
          btn.textContent = "Copy link";
        }, 1400);
      });
    });
  }

  let listening = false;
  function show() {
    setTone();
    paint();
    if (!listening && window.PlainlyCloud?.onChange) {
      listening = true;
      window.PlainlyCloud.onChange(() => {
        if (!document.getElementById("view-profile")?.hidden) paint();
      });
      window.addEventListener("plainly:cloud-synced", () => {
        if (!document.getElementById("view-profile")?.hidden) paint();
      });
    }
  }

  return { show };
})();

window.PlainlyCrush = (() => {
  const { escapeHtml, encodePayload, decodePayload, copyText } =
    window.PlainlyUtils;

  const toneColors = {
    enemies: "#455868",
    negative: "#6a5f55",
    neutral: "#4f645c",
    positive: "#2f6f5e",
    love: "#7a4554",
  };

  function crushData() {
    return window.PLAINLY.crush;
  }

  function replyById(id) {
    return crushData().replies.find((r) => r.id === id) || null;
  }

  function setTone(tone) {
    document.documentElement.style.setProperty(
      "--zone",
      toneColors[tone] || toneColors.love
    );
  }

  function boundariesList(items) {
    return `
      <p class="zone-kicker boundaries-kicker">Boundaries</p>
      <ol class="boundaries">${items
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("")}</ol>`;
  }

  function mountExtras(shell, key) {
    let host = shell.querySelector("[data-crush-extras]");
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("data-crush-extras", "true");
      host.className = "stance-extras";
      shell.appendChild(host);
    }
    window.PlainlyExtras?.render(host, { key, showFreedoms: true });
  }

  function noteMarkup({ from, to, ps }) {
    const toLine = to ? `For ${escapeHtml(to)}` : "For you";
    const fromLine = from ? `— ${escapeHtml(from)}` : "— someone who means it";
    const psLine = ps
      ? `<p class="crush-ps"><span>P.S.</span> ${escapeHtml(ps)}</p>`
      : "";
    return `
      <article class="crush-note" aria-label="Crush note">
        <p class="crush-note-to">${toLine}</p>
        <p class="crush-note-message">${escapeHtml(crushData().sendMessage)}</p>
        <p class="crush-note-from">${fromLine}</p>
        ${psLine}
      </article>
    `;
  }

  function renderCompose(shell) {
    setTone("love");
    shell.innerHTML = `
      <div class="crush-layout">
        <form class="crush-compose" id="crush-compose" novalidate>
          <label class="field">
            <span>From <em>(optional)</em></span>
            <input id="crush-from" name="from" maxlength="60" placeholder="Your name" autocomplete="nickname" />
          </label>
          <label class="field">
            <span>To <em>(optional)</em></span>
            <input id="crush-to" name="to" maxlength="60" placeholder="Their name" autocomplete="off" />
          </label>
          <label class="field">
            <span>P.S. <em>(optional)</em></span>
            <textarea id="crush-ps" name="ps" rows="3" maxlength="280" placeholder="One small extra line…"></textarea>
          </label>
          <button type="submit" class="btn-primary">Make note link</button>
        </form>

        <div class="crush-preview-col">
          ${noteMarkup({ from: "", to: "", ps: "" })}
          <div class="crush-aside">
            <p class="zone-kicker">If you send this</p>
            <h2 class="subtype-title">Your side of the note</h2>
            <p class="subtype-blurb">${escapeHtml(crushData().sendBlurb)}</p>
            ${boundariesList(crushData().sendBoundaries)}
            <div data-crush-extras class="stance-extras"></div>
          </div>
        </div>
      </div>
      <div id="crush-share" class="crush-share" hidden></div>
    `;

    mountExtras(shell.querySelector(".crush-aside"), "crush:send");

    const form = shell.querySelector("#crush-compose");
    const preview = shell.querySelector(".crush-preview-col");

    const syncPreview = () => {
      const from = form.from.value.trim();
      const to = form.to.value.trim();
      const ps = form.ps.value.trim();
      preview.querySelector(".crush-note").outerHTML = noteMarkup({
        from,
        to,
        ps,
      });
    };
    form.addEventListener("input", syncPreview);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        v: 1,
        from: form.from.value.trim(),
        to: form.to.value.trim(),
        ps: form.ps.value.trim(),
      };
      const hash = `#crush/n/${encodePayload(payload)}`;
      const url = `${location.origin}${location.pathname}${hash}`;
      history.replaceState(null, "", hash);

      window.PlainlyStore?.saveCrushNote({
        id: window.PlainlyUtils.uid(),
        direction: "sent",
        from: payload.from,
        to: payload.to,
        ps: payload.ps,
        reply: "",
        url,
        savedAt: Date.now(),
      });

      const share = shell.querySelector("#crush-share");
      share.hidden = false;
      share.innerHTML = `
        <p class="zone-kicker">Ready to send</p>
        <h2 class="subtype-title">Your note link</h2>
        <p class="subtype-blurb">Share this privately. They’ll open it and choose how they feel. Saved to your <a class="text-link" href="#profile/crushes">profile</a>.</p>
        <div class="share-row">
          <code class="share-url" id="crush-share-url">${escapeHtml(url)}</code>
          <button type="button" class="btn-primary" id="crush-copy">Copy link</button>
        </div>
      `;
      share.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const copyBtn = share.querySelector("#crush-copy");
      copyBtn.addEventListener("click", async () => {
        const ok = await copyText(url);
        copyBtn.textContent = ok ? "Copied" : "Select the link above";
      });
    });
  }

  function renderOpen(shell, payload) {
    setTone("love");
    const openUrl = `${location.origin}${location.pathname}${location.hash}`;
    window.PlainlyStore?.saveCrushNote({
      id: `recv-${encodePayload(payload).slice(0, 24)}`,
      direction: "received",
      from: payload.from || "",
      to: payload.to || "",
      ps: payload.ps || "",
      reply: "",
      url: openUrl,
      savedAt: Date.now(),
    });
    const replies = crushData().replies;
    shell.innerHTML = `
      <div class="crush-receive">
        ${noteMarkup(payload)}
        <div class="crush-reply-block">
          <p class="zone-kicker">How do you feel?</p>
          <h2 class="page-title crush-reply-title">Send something back</h2>
          <p class="page-lede">Pick one answer. Each comes with plain boundaries.</p>
          <div class="crush-replies" id="crush-replies">
            ${replies
              .map(
                (r) => `
              <button type="button" class="crush-reply-btn" data-reply="${r.id}">
                <span class="crush-reply-label">${escapeHtml(r.label)}</span>
                <span class="crush-reply-blurb">${escapeHtml(r.blurb)}</span>
              </button>`
              )
              .join("")}
          </div>
          <div id="crush-reply-preview" class="crush-reply-preview" hidden></div>
        </div>
      </div>
    `;

    const preview = shell.querySelector("#crush-reply-preview");
    shell.querySelector("#crush-replies").addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-reply]");
      if (!btn) return;
      const reply = replyById(btn.dataset.reply);
      if (!reply) return;

      [...shell.querySelectorAll(".crush-reply-btn")].forEach((el) => {
        el.setAttribute("aria-pressed", String(el === btn));
      });

      setTone(reply.tone);
      const replyPayload = {
        v: 1,
        from: payload.from || "",
        to: payload.to || "",
        ps: payload.ps || "",
        reply: reply.id,
      };
      const hash = `#crush/r/${encodePayload(replyPayload)}`;
      const url = `${location.origin}${location.pathname}${hash}`;
      history.replaceState(null, "", hash);

      window.PlainlyStore?.saveCrushNote({
        id: `reply-${reply.id}-${encodePayload(replyPayload).slice(0, 20)}`,
        direction: "reply",
        from: replyPayload.from,
        to: replyPayload.to,
        ps: replyPayload.ps,
        reply: reply.id,
        url,
        savedAt: Date.now(),
      });

      preview.hidden = false;
      preview.innerHTML = `
        <p class="zone-kicker">Your reply</p>
        <h3 class="subtype-title">${escapeHtml(reply.label)}</h3>
        <p class="subtype-blurb">${escapeHtml(reply.blurb)}</p>
        ${boundariesList(reply.boundaries)}
        <div data-crush-extras class="stance-extras"></div>
        <div class="share-row">
          <button type="button" class="btn-primary" id="crush-copy-reply">Copy reply link</button>
          <span class="share-help">Send this back so they can read your answer + boundaries.</span>
        </div>
      `;
      mountExtras(preview, `crush:${reply.id}`);
      preview.scrollIntoView({ behavior: "smooth", block: "nearest" });

      preview.querySelector("#crush-copy-reply").addEventListener("click", async (e) => {
        const ok = await copyText(url);
        e.currentTarget.textContent = ok ? "Copied" : "Copy from address bar";
      });
    });
  }

  function renderReply(shell, payload) {
    const reply = replyById(payload.reply);
    if (!reply) {
      renderCompose(shell);
      return;
    }
    setTone(reply.tone);
    shell.innerHTML = `
      <div class="crush-receive">
        ${noteMarkup(payload)}
        <div class="crush-reply-result">
          <p class="zone-kicker">They answered</p>
          <h2 class="page-title crush-reply-title">${escapeHtml(reply.label)}</h2>
          <p class="page-lede">${escapeHtml(reply.blurb)}</p>
          <div class="crush-aside">
            <p class="zone-kicker">Boundaries that come with this</p>
            ${boundariesList(reply.boundaries)}
            <div data-crush-extras class="stance-extras"></div>
          </div>
          <p class="crush-next">
            <a class="text-link" href="#crush">Write a new crush note</a>
            ·
            <a class="text-link" href="#spectrum/positive/crush">Open spectrum: romantic crush</a>
          </p>
        </div>
      </div>
    `;
    mountExtras(shell.querySelector(".crush-aside"), `crush:${reply.id}`);
  }

  function show(hashRaw) {
    const shell = document.getElementById("crush-shell");
    const lede = document.getElementById("crush-lede");
    // Prefer live location.hash so deep links survive boot races.
    const live = location.hash || "";
    const raw = String(live || hashRaw || "")
      .replace(/^#/, "")
      .trim();
    const parts = raw.split("/").filter(Boolean);
    // crush | crush/n/PAYLOAD | crush/r/PAYLOAD
    if (parts[1] === "n" && parts[2]) {
      const payload = window.PlainlyUtils.decodePayload(parts[2]);
      if (!payload) {
        lede.textContent = crushData().sendBlurb;
        renderCompose(shell);
        return;
      }
      lede.textContent = "Someone sent you a crush note. Answer plainly.";
      renderOpen(shell, payload);
      return;
    }
    if (parts[1] === "r" && parts[2]) {
      const payload = window.PlainlyUtils.decodePayload(parts[2]);
      if (!payload || !payload.reply) {
        lede.textContent = crushData().sendBlurb;
        renderCompose(shell);
        return;
      }
      lede.textContent = "Here’s how they feel — and what that means.";
      renderReply(shell, payload);
      return;
    }
    lede.textContent = crushData().sendBlurb;
    renderCompose(shell);
  }

  return { show };
})();

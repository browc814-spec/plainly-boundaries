(() => {
  const views = {
    spectrum: document.getElementById("view-spectrum"),
    crush: document.getElementById("view-crush"),
    journal: document.getElementById("view-journal"),
    together: document.getElementById("view-together"),
    profile: document.getElementById("view-profile"),
  };

  function currentRoute() {
    const hash = location.hash || "";
    const raw = hash.replace(/^#/, "").trim();
    const parts = raw.split("/").filter(Boolean);
    const head = parts[0] || "spectrum";

    if (head === "crush") return { view: "crush", raw: hash || "#crush" };
    if (head === "journal") return { view: "journal", raw: hash || "#journal" };
    if (head === "together" || head === "invite") {
      return { view: "together", raw: hash || "#together" };
    }
    if (head === "profile" || head === "message") {
      return { view: "profile", raw: hash || "#profile" };
    }
    if (head === "spectrum" || head === "" || head === "top") {
      return { view: "spectrum", raw: hash || "#spectrum" };
    }
    if (window.PlainlySpectrum.parseStanceHash(hash || `#${raw}`)) {
      return { view: "spectrum", raw: hash };
    }
    return { view: "spectrum", raw: "#spectrum" };
  }

  function setNav(view) {
    document.querySelectorAll("[data-nav]").forEach((el) => {
      const active = el.dataset.nav === view;
      el.classList.toggle("is-active", active);
      if (el.tagName === "A") {
        if (active) el.setAttribute("aria-current", "page");
        else el.removeAttribute("aria-current");
      }
    });
  }

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
    setNav(name);
  }

  function route({ scrollTop = true } = {}) {
    const { view, raw } = currentRoute();
    showView(view);
    if (view === "spectrum") window.PlainlySpectrum.show(raw);
    if (view === "crush") window.PlainlyCrush.show(raw || location.hash);
    if (view === "journal") window.PlainlyJournal.show();
    if (view === "together") window.PlainlyTogether.show(raw || location.hash);
    if (view === "profile") window.PlainlyProfile.show();
    if (scrollTop) window.scrollTo({ top: 0, behavior: "auto" });
  }

  window.addEventListener("hashchange", () => route({ scrollTop: true }));

  const header = document.querySelector(".site-header");
  const onScroll = () => {
    header.classList.toggle("is-stuck", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Don't let the hash router overwrite an OAuth callback (#access_token=... / #error=...)
  // before Supabase has read it.
  const authCallback = /(^#|[#&])(access_token|refresh_token|error|error_description)=/.test(
    location.hash || ""
  );
  if (!authCallback) {
    route({ scrollTop: true });
    window.setTimeout(() => route({ scrollTop: false }), 0);
  }

  window.PlainlyCloud?.init?.()
    .catch(() => {})
    .finally(() => {
      if (authCallback) {
        if (/access_token|error/.test(location.hash)) history.replaceState(null, "", "#profile");
        route({ scrollTop: true });
      }
    });
})();

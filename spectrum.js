window.PlainlySpectrum = (() => {
  const { escapeHtml } = window.PlainlyUtils;
  const zones = () => window.PLAINLY.zones;
  const zoneColors = {
    enemies: "#455868",
    negative: "#6a5f55",
    neutral: "#4f645c",
    positive: "#2f6f5e",
    love: "#7a4554",
  };

  let els = null;
  let value = 50;
  let activeZone = null;
  let activeSubtypeId = null;
  let dragging = false;
  let syncingHash = false;
  let bound = false;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function zoneAt(v) {
    const list = zones();
    return list.find((z) => v >= z.range[0] && v <= z.range[1]) || list[list.length - 1];
  }

  function midpoint(zone) {
    return (zone.range[0] + zone.range[1]) / 2;
  }

  function stanceHash(zoneId, subtypeId) {
    return `#spectrum/${zoneId}/${subtypeId}`;
  }

  function writeHash(zoneId, subtypeId) {
    const next = stanceHash(zoneId, subtypeId);
    if (location.hash === next) return;
    syncingHash = true;
    history.replaceState(null, "", next);
    syncingHash = false;
  }

  function parseStanceHash(raw) {
    const parts = raw.replace(/^#/, "").split("/").filter(Boolean);
    // #spectrum/love/dear-friend or legacy #love/dear-friend
    let zoneId;
    let subtypeId;
    if (parts[0] === "spectrum") {
      zoneId = parts[1];
      subtypeId = parts[2];
    } else if (parts.length >= 2 && zones().some((z) => z.id === parts[0])) {
      zoneId = parts[0];
      subtypeId = parts[1];
    } else {
      return null;
    }
    const zone = zones().find((z) => z.id === zoneId);
    if (!zone) return null;
    const subtype =
      zone.subtypes.find((s) => s.id === subtypeId) || zone.subtypes[0];
    return { zone, subtype };
  }

  function cacheEls() {
    els = {
      spectrum: document.getElementById("spectrum"),
      fill: document.getElementById("spectrum-fill"),
      thumb: document.getElementById("spectrum-thumb"),
      zones: document.getElementById("spectrum-zones"),
      nowLabel: document.getElementById("now-label"),
      zoneKicker: document.getElementById("zone-kicker"),
      zoneTitle: document.getElementById("zone-title"),
      zoneBlurb: document.getElementById("zone-blurb"),
      subtypeRow: document.getElementById("subtype-row"),
      subtypeTitle: document.getElementById("subtype-title"),
      subtypeBlurb: document.getElementById("subtype-blurb"),
      boundaries: document.getElementById("boundaries"),
      boundaryPanel: document.getElementById("boundary-panel"),
      copyLink: document.getElementById("copy-link"),
      extras: document.getElementById("stance-extras"),
    };
  }

  function setSpectrumVisual(v) {
    els.fill.style.width = `${v}%`;
    els.thumb.style.left = `${v}%`;
    els.spectrum.setAttribute("aria-valuenow", String(Math.round(v)));
  }

  function setAtmosphere(zone) {
    document.documentElement.style.setProperty(
      "--zone",
      zoneColors[zone.id] || zoneColors.neutral
    );
  }

  function renderBoundaries(subtype) {
    els.subtypeTitle.textContent = subtype.label;
    els.subtypeBlurb.textContent = subtype.blurb;
    els.copyLink.hidden = false;
    els.copyLink.classList.remove("is-copied");
    els.copyLink.textContent = "Copy link to this stance";
    els.boundaryPanel.style.animation = "none";
    void els.boundaryPanel.offsetWidth;
    els.boundaryPanel.style.animation = "";
    els.boundaries.innerHTML = subtype.boundaries
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    window.PlainlyExtras?.render(els.extras, {
      key: `spectrum:${subtype.id}`,
      showFreedoms: true,
    });
  }

  function renderSubtypes(zone, preferredId) {
    const nextId =
      preferredId && zone.subtypes.some((s) => s.id === preferredId)
        ? preferredId
        : zone.subtypes[0].id;
    activeSubtypeId = nextId;
    els.subtypeRow.innerHTML = zone.subtypes
      .map(
        (s) => `
        <button type="button" class="subtype-btn" role="tab" aria-selected="${
          s.id === nextId
        }" data-subtype="${s.id}">${escapeHtml(s.label)}</button>`
      )
      .join("");
    renderBoundaries(zone.subtypes.find((s) => s.id === nextId));
    writeHash(zone.id, nextId);
  }

  function applyZone(zone, { keepSubtype = false } = {}) {
    const zoneChanged = !activeZone || activeZone.id !== zone.id;
    activeZone = zone;
    setAtmosphere(zone);
    els.nowLabel.textContent = zone.label;
    els.spectrum.setAttribute("aria-valuetext", zone.label);
    els.zoneTitle.textContent = zone.label;
    els.zoneBlurb.textContent = zone.blurb;
    els.zoneKicker.textContent = "In this range";
    if (zoneChanged || !keepSubtype) {
      renderSubtypes(zone, keepSubtype ? activeSubtypeId : null);
    } else if (activeSubtypeId) {
      writeHash(zone.id, activeSubtypeId);
    }
  }

  function setValue(v, { keepSubtype = true } = {}) {
    value = clamp(v, 0, 100);
    setSpectrumVisual(value);
    applyZone(zoneAt(value), { keepSubtype });
  }

  function valueFromPointer(event) {
    const track = els.spectrum.querySelector(".spectrum-track");
    const rect = track.getBoundingClientRect();
    const x = (event.clientX ?? event.touches?.[0]?.clientX) - rect.left;
    return clamp((x / rect.width) * 100, 0, 100);
  }

  function bind() {
    if (bound) return;
    bound = true;

    els.zones.innerHTML = zones()
      .map(() => "<span></span>")
      .join("");

    els.spectrum.addEventListener("pointerdown", (event) => {
      dragging = true;
      els.spectrum.classList.add("is-dragging");
      els.spectrum.setPointerCapture?.(event.pointerId);
      setValue(valueFromPointer(event), { keepSubtype: false });
    });
    els.spectrum.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setValue(valueFromPointer(event), { keepSubtype: true });
    });
    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      els.spectrum.classList.remove("is-dragging");
      try {
        els.spectrum.releasePointerCapture?.(event.pointerId);
      } catch (_) {}
    };
    els.spectrum.addEventListener("pointerup", endDrag);
    els.spectrum.addEventListener("pointercancel", endDrag);

    els.spectrum.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 8 : 3;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        setValue(value + step, { keepSubtype: true });
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        setValue(value - step, { keepSubtype: true });
      } else if (event.key === "Home") {
        event.preventDefault();
        setValue(0, { keepSubtype: false });
      } else if (event.key === "End") {
        event.preventDefault();
        setValue(100, { keepSubtype: false });
      }
    });

    els.subtypeRow.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-subtype]");
      if (!btn || !activeZone) return;
      const id = btn.dataset.subtype;
      activeSubtypeId = id;
      [...els.subtypeRow.querySelectorAll("[data-subtype]")].forEach((el) => {
        el.setAttribute("aria-selected", String(el.dataset.subtype === id));
      });
      renderBoundaries(activeZone.subtypes.find((s) => s.id === id));
      writeHash(activeZone.id, id);
    });

    els.copyLink.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}${location.hash}`;
      const ok = await window.PlainlyUtils.copyText(url);
      els.copyLink.textContent = ok ? "Copied" : "Copy from address bar";
      els.copyLink.classList.toggle("is-copied", ok);
      if (ok) {
        window.setTimeout(() => {
          els.copyLink.textContent = "Copy link to this stance";
          els.copyLink.classList.remove("is-copied");
        }, 1600);
      }
    });
  }

  function show(hashRaw) {
    cacheEls();
    bind();
    const parsed = parseStanceHash(hashRaw || "");
    if (parsed) {
      value = midpoint(parsed.zone);
      setSpectrumVisual(value);
      activeZone = null;
      applyZone(parsed.zone, { keepSubtype: false });
      renderSubtypes(parsed.zone, parsed.subtype.id);
    } else {
      activeZone = null;
      setValue(50, { keepSubtype: false });
    }
  }

  function onHashChange(hashRaw) {
    if (syncingHash) return false;
    const parsed = parseStanceHash(hashRaw || "");
    if (!parsed) return false;
    show(hashRaw);
    return true;
  }

  return { show, onHashChange, parseStanceHash };
})();

window.PlainlyExtras = (() => {
  const { escapeHtml } = window.PlainlyUtils;
  const EXTRAS_KEY = "plainly.extras.v1";

  function emptySelection() {
    return {
      optional: [],
      customBoundaries: [],
      freedoms: [],
      customFreedoms: [],
    };
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(EXTRAS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (_) {
      return {};
    }
  }

  function saveAll(all) {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(all));
    window.PlainlyCloud?.schedulePush?.();
  }

  function loadSelection(key) {
    const all = loadAll();
    return { ...emptySelection(), ...(all[key] || {}) };
  }

  function saveSelection(key, selection) {
    const all = loadAll();
    all[key] = selection;
    saveAll(all);
  }

  function catalogMap() {
    const map = new Map();
    (window.PLAINLY_EXTRAS?.freedomsCatalog || []).forEach((f) => map.set(f.id, f));
    return map;
  }

  function defFor(key) {
    return (
      window.PLAINLY_EXTRAS?.byKey?.[key] || {
        optionalBoundaries: [],
        freedomIds: [],
      }
    );
  }

  function freedomOptions(def) {
    const map = catalogMap();
    return (def.freedomIds || [])
      .map((id) => map.get(id))
      .filter(Boolean);
  }

  function render(mount, { key, showFreedoms = true } = {}) {
    if (!mount) return;
    const def = defFor(key);
    let selection = loadSelection(key);
    const optional = def.optionalBoundaries || [];
    const freedoms = freedomOptions(def);

    const paint = () => {
      selection = loadSelection(key);
      mount.innerHTML = `
        <section class="extras-block" data-extras-key="${escapeHtml(key)}">
          <div class="extras-section">
            <header class="extras-head">
              <p class="zone-kicker">Optional boundaries</p>
              <h3 class="extras-title">Add more if you need them</h3>
              <p class="extras-lede">Core boundaries are above. Toggle extras or write your own.</p>
            </header>
            ${
              optional.length
                ? `<div class="extras-choices" data-kind="optional">
                    ${optional
                      .map((item) => {
                        const on = selection.optional.includes(item.id);
                        return `
                        <button type="button" class="choice-chip ${
                          on ? "is-on" : ""
                        }" data-optional="${escapeHtml(item.id)}" aria-pressed="${on}">
                          ${escapeHtml(item.text)}
                        </button>`;
                      })
                      .join("")}
                  </div>`
                : ""
            }
            <ul class="extras-custom-list" data-list="customBoundaries">
              ${selection.customBoundaries
                .map(
                  (text, index) => `
                <li>
                  <span>${escapeHtml(text)}</span>
                  <button type="button" class="btn-quiet danger" data-remove-boundary="${index}">Remove</button>
                </li>`
                )
                .join("")}
            </ul>
            <form class="extras-add" data-add="boundary">
              <label class="field">
                <span>Your own boundary</span>
                <input name="text" maxlength="240" placeholder="e.g. Weeknights are for winding down — text tomorrow" />
              </label>
              <button type="submit" class="btn-primary">Add boundary</button>
            </form>
            ${
              activeBoundaryLines(key).length
                ? `<div class="extras-active">
                    <p class="zone-kicker">Additional boundaries in play</p>
                    <ol class="boundaries extras-boundaries">
                      ${activeBoundaryLines(key)
                        .map((line) => `<li>${escapeHtml(line)}</li>`)
                        .join("")}
                    </ol>
                  </div>`
                : ""
            }
          </div>

          ${
            showFreedoms
              ? `<div class="extras-section freedoms-section">
            <header class="extras-head">
              <p class="zone-kicker">Freedoms</p>
              <h3 class="extras-title">What I like with you</h3>
              <p class="extras-lede">The yeses that make this relationship feel good — pick any that fit.</p>
            </header>
            <div class="extras-choices freedoms-choices" data-kind="freedoms">
              ${freedoms
                .map((item) => {
                  const on = selection.freedoms.includes(item.id);
                  return `
                  <button type="button" class="choice-chip freedom-chip ${
                    on ? "is-on" : ""
                  }" data-freedom="${escapeHtml(item.id)}" aria-pressed="${on}">
                    ${escapeHtml(item.label)}
                  </button>`;
                })
                .join("")}
            </div>
            <ul class="extras-custom-list" data-list="customFreedoms">
              ${selection.customFreedoms
                .map(
                  (text, index) => `
                <li>
                  <span>${escapeHtml(text)}</span>
                  <button type="button" class="btn-quiet danger" data-remove-freedom="${index}">Remove</button>
                </li>`
                )
                .join("")}
            </ul>
            <form class="extras-add" data-add="freedom">
              <label class="field">
                <span>Something else you like together</span>
                <input name="text" maxlength="120" placeholder="e.g. Bookstore browsing" />
              </label>
              <button type="submit" class="btn-primary">Add freedom</button>
            </form>
            ${
              selection.freedoms.length || selection.customFreedoms.length
                ? `<div class="freedoms-summary">
                    <p class="zone-kicker">With you, I like</p>
                    <ul class="freedoms-summary-list">
                      ${selection.freedoms
                        .map((id) => {
                          const label = catalogMap().get(id)?.label || id;
                          return `<li>${escapeHtml(label)}</li>`;
                        })
                        .join("")}
                      ${selection.customFreedoms
                        .map((text) => `<li>${escapeHtml(text)}</li>`)
                        .join("")}
                    </ul>
                  </div>`
                : ""
            }
          </div>`
              : ""
          }
        </section>
      `;

      bind(mount, key, paint);
    };

    paint();
  }

  function bind(mount, key, paint) {
    const selection = () => loadSelection(key);
    const write = (next) => {
      saveSelection(key, next);
      paint();
    };

    mount.querySelectorAll("[data-optional]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.optional;
        const cur = selection();
        const set = new Set(cur.optional);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        write({ ...cur, optional: [...set] });
      });
    });

    mount.querySelectorAll("[data-freedom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.freedom;
        const cur = selection();
        const set = new Set(cur.freedoms);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        write({ ...cur, freedoms: [...set] });
      });
    });

    mount.querySelectorAll("[data-remove-boundary]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.removeBoundary);
        const cur = selection();
        cur.customBoundaries = cur.customBoundaries.filter((_, i) => i !== index);
        write(cur);
      });
    });

    mount.querySelectorAll("[data-remove-freedom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.removeFreedom);
        const cur = selection();
        cur.customFreedoms = cur.customFreedoms.filter((_, i) => i !== index);
        write(cur);
      });
    });

    mount.querySelectorAll("form[data-add]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = form.text.value.trim();
        if (!text) return;
        const cur = selection();
        if (form.dataset.add === "boundary") {
          cur.customBoundaries = [...cur.customBoundaries, text].slice(0, 20);
        } else {
          cur.customFreedoms = [...cur.customFreedoms, text].slice(0, 20);
        }
        write(cur);
      });
    });
  }

  /** Active optional + custom boundary lines for display/export */
  function activeBoundaryLines(key) {
    const def = defFor(key);
    const selection = loadSelection(key);
    const optional = (def.optionalBoundaries || [])
      .filter((b) => selection.optional.includes(b.id))
      .map((b) => b.text);
    return [...optional, ...selection.customBoundaries];
  }

  function activeFreedomLabels(key) {
    const map = catalogMap();
    const selection = loadSelection(key);
    return [
      ...selection.freedoms.map((id) => map.get(id)?.label || id),
      ...selection.customFreedoms,
    ];
  }

  return {
    render,
    loadSelection,
    activeBoundaryLines,
    activeFreedomLabels,
  };
})();

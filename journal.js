window.PlainlyJournal = (() => {
  const { escapeHtml, formatDate, uid } = window.PlainlyUtils;
  const STORAGE_KEY = "plainly.friendsJournal.v1";

  let editingId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function save(entries) {
    if (window.PlainlyStore?.saveJournal) {
      window.PlainlyStore.saveJournal(entries);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function kindLabel(kind) {
    if (kind === "date") return "Date";
    if (kind === "other") return "Other";
    return "Friend";
  }

  function renderList() {
    const list = document.getElementById("journal-list");
    const filter = document.getElementById("journal-filter").value;
    let entries = load().sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter !== "all") {
      entries = entries.filter((e) => e.kind === filter);
    }

    if (!entries.length) {
      list.innerHTML = `
        <p class="journal-empty">
          No notes yet. Write something small and true about someone you care about.
        </p>`;
      return;
    }

    list.innerHTML = entries
      .map(
        (entry) => `
      <article class="journal-entry" data-id="${escapeHtml(entry.id)}">
        <header class="journal-entry-head">
          <div>
            <p class="journal-entry-meta">
              <span>${escapeHtml(kindLabel(entry.kind))}</span>
              <span aria-hidden="true">·</span>
              <time datetime="${new Date(entry.updatedAt).toISOString()}">${escapeHtml(
                formatDate(entry.updatedAt)
              )}</time>
            </p>
            <h3 class="journal-entry-name">${escapeHtml(entry.name)}</h3>
            ${
              entry.title
                ? `<p class="journal-entry-title">${escapeHtml(entry.title)}</p>`
                : ""
            }
          </div>
          <div class="journal-entry-actions">
            <button type="button" class="btn-quiet" data-action="edit">Edit</button>
            <button type="button" class="btn-quiet danger" data-action="delete">Delete</button>
          </div>
        </header>
        <p class="journal-entry-body">${escapeHtml(entry.body).replaceAll(
          "\n",
          "<br />"
        )}</p>
      </article>`
      )
      .join("");
  }

  function resetForm() {
    editingId = null;
    const form = document.getElementById("journal-form");
    form.reset();
    document.getElementById("journal-kind").value = "friend";
    document.getElementById("journal-save").textContent = "Save note";
    document.getElementById("journal-cancel").hidden = true;
  }

  function fillForm(entry) {
    editingId = entry.id;
    document.getElementById("journal-name").value = entry.name;
    document.getElementById("journal-kind").value = entry.kind;
    document.getElementById("journal-title").value = entry.title || "";
    document.getElementById("journal-body").value = entry.body;
    document.getElementById("journal-save").textContent = "Update note";
    document.getElementById("journal-cancel").hidden = false;
    document.getElementById("journal-name").focus();
  }

  let bound = false;
  function bind() {
    if (bound) return;
    bound = true;

    document.getElementById("journal-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("journal-name").value.trim();
      const body = document.getElementById("journal-body").value.trim();
      const title = document.getElementById("journal-title").value.trim();
      const kind = document.getElementById("journal-kind").value;
      if (!name || !body) return;

      const entries = load();
      const now = Date.now();
      if (editingId) {
        const idx = entries.findIndex((e) => e.id === editingId);
        if (idx >= 0) {
          entries[idx] = {
            ...entries[idx],
            name,
            body,
            title,
            kind,
            updatedAt: now,
          };
        }
      } else {
        entries.push({
          id: uid(),
          name,
          body,
          title,
          kind,
          createdAt: now,
          updatedAt: now,
        });
      }
      save(entries);
      resetForm();
      renderList();
    });

    document.getElementById("journal-cancel").addEventListener("click", () => {
      resetForm();
    });

    document.getElementById("journal-filter").addEventListener("change", renderList);

    document.getElementById("journal-list").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-action]");
      if (!btn) return;
      const article = btn.closest("[data-id]");
      if (!article) return;
      const id = article.dataset.id;
      const entries = load();
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;

      if (btn.dataset.action === "edit") {
        fillForm(entry);
        return;
      }
      if (btn.dataset.action === "delete") {
        const next = entries.filter((e) => e.id !== id);
        save(next);
        if (editingId === id) resetForm();
        renderList();
      }
    });
  }

  function show() {
    document.documentElement.style.setProperty("--zone", "#2f6f5e");
    bind();
    resetForm();
    renderList();
  }

  return { show, list: load };
})();

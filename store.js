window.PlainlyStore = (() => {
  const PROFILE_KEY = "plainly.profile.v1";
  const JOURNAL_KEY = "plainly.friendsJournal.v1";

  const emptyProfile = () => ({
    name: "",
    tagline: "",
    people: [],
    crushNotes: [],
    dating: [],
    messages: [],
    updatedAt: Date.now(),
  });

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback();
      const data = JSON.parse(raw);
      return data ?? fallback();
    } catch (_) {
      return fallback();
    }
  }

  function notifyCloud(options = {}) {
    if (options.skipCloud) return;
    window.PlainlyCloud?.schedulePush?.();
  }

  function loadProfile() {
    const data = readJson(PROFILE_KEY, emptyProfile);
    return {
      ...emptyProfile(),
      ...data,
      people: Array.isArray(data.people) ? data.people : [],
      crushNotes: Array.isArray(data.crushNotes) ? data.crushNotes : [],
      dating: Array.isArray(data.dating) ? data.dating : [],
      messages: Array.isArray(data.messages) ? data.messages : [],
    };
  }

  function saveProfile(profile, options = {}) {
    const next = { ...profile, updatedAt: Date.now() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    notifyCloud(options);
    return next;
  }

  function updateProfile(mutator, options = {}) {
    const current = loadProfile();
    const next = mutator({ ...current });
    return saveProfile(next, options);
  }

  function loadJournal() {
    const data = readJson(JOURNAL_KEY, () => []);
    return Array.isArray(data) ? data : [];
  }

  function saveJournal(entries, options = {}) {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    notifyCloud(options);
    return entries;
  }

  function saveCrushNote(entry) {
    return updateProfile((profile) => {
      const notes = profile.crushNotes.filter((n) => n.id !== entry.id);
      notes.unshift({ ...entry, savedAt: entry.savedAt || Date.now() });
      profile.crushNotes = notes.slice(0, 100);
      return profile;
    });
  }

  function peopleByRole(role) {
    return loadProfile()
      .people.filter((p) => p.role === role)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    PROFILE_KEY,
    JOURNAL_KEY,
    emptyProfile,
    loadProfile,
    saveProfile,
    updateProfile,
    loadJournal,
    saveJournal,
    saveCrushNote,
    peopleByRole,
  };
})();

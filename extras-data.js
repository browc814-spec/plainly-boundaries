window.PLAINLY_EXTRAS = {
  freedomsCatalog: [
    { id: "movie-nights", label: "Movie nights" },
    { id: "weekly-hangouts", label: "Weekly hangouts" },
    { id: "monthly-catchups", label: "Monthly catchups" },
    { id: "lots-of-space", label: "Lots of space between visits" },
    { id: "spontaneous-plans", label: "Spontaneous plans" },
    { id: "planned-plans", label: "Planned plans only" },
    { id: "one-on-one", label: "One-on-one time" },
    { id: "group-hangs", label: "Group hangs" },
    { id: "shared-meals", label: "Shared meals" },
    { id: "long-walks", label: "Long walks" },
    { id: "voice-notes", label: "Voice notes" },
    { id: "good-morning-texts", label: "Good morning texts" },
    { id: "deep-talks", label: "Deep talks" },
    { id: "light-company", label: "Light, easy company" },
    { id: "quiet-company", label: "Quiet company / parallel presence" },
    { id: "gaming", label: "Gaming together" },
    { id: "study-cowork", label: "Study / cowork sessions" },
    { id: "hugs", label: "Hugs (when asked)" },
    { id: "no-touch", label: "No physical touch" },
    { id: "logistics-only", label: "Logistics-only contact" },
    { id: "public-polite", label: "Public politeness only" },
    { id: "check-ins", label: "Occasional check-ins" },
    { id: "celebration", label: "Showing up for big moments" },
    { id: "honesty-hour", label: "Honest check-ins about us" },
  ],

  // key: spectrum:<subtypeId> | crush:send | crush:<replyId>
  byKey: {
    "spectrum:open-conflict": {
      optionalBoundaries: [
        { id: "no-social-media", text: "Do not tag, meme, or subtweet me." },
        { id: "no-shared-events", text: "If I’ll be at an event, give me a heads-up or sit this one out." },
        { id: "lawyer-only", text: "Route hard topics through the agreed intermediary only." },
      ],
      freedomIds: ["logistics-only", "public-polite", "lots-of-space"],
    },
    "spectrum:no-contact": {
      optionalBoundaries: [
        { id: "no-new-accounts", text: "Do not contact me from new accounts or numbers." },
        { id: "no-gifts-to-home", text: "Do not send anything to my home or workplace." },
      ],
      freedomIds: ["lots-of-space", "logistics-only"],
    },
    "spectrum:protective-distance": {
      optionalBoundaries: [
        { id: "safety-first", text: "If paths cross, prioritize my physical and emotional safety over your need to talk." },
        { id: "no-surprise-visits", text: "No surprise appearances in my routines." },
      ],
      freedomIds: ["lots-of-space", "logistics-only", "public-polite"],
    },
    "spectrum:hurt": {
      optionalBoundaries: [
        { id: "no-love-bombing", text: "Do not flood me with apologies or grand gestures while I’m raw." },
        { id: "topic-pause", text: "Pause the triggering topic until I reopen it." },
      ],
      freedomIds: ["lots-of-space", "check-ins", "planned-plans", "light-company"],
    },
    "spectrum:distrust": {
      optionalBoundaries: [
        { id: "receipts-ok", text: "I’m allowed to ask for clarity without being called controlling." },
        { id: "no-secret-tests", text: "Do not set secret tests to “prove” loyalty either way." },
      ],
      freedomIds: ["planned-plans", "check-ins", "lots-of-space", "honesty-hour"],
    },
    "spectrum:resentment": {
      optionalBoundaries: [
        { id: "no-sarcasm", text: "No sarcastic digs about the unresolved pattern." },
        { id: "repair-plan", text: "If we repair, it needs a concrete plan — not vibes." },
      ],
      freedomIds: ["lots-of-space", "monthly-catchups", "honesty-hour", "light-company"],
    },
    "spectrum:acquaintance": {
      optionalBoundaries: [
        { id: "no-late-texts", text: "Keep messages to daytime / ordinary hours." },
        { id: "no-heavy-dumps", text: "I’m not available for crisis processing." },
      ],
      freedomIds: ["group-hangs", "monthly-catchups", "light-company", "lots-of-space"],
    },
    "spectrum:colleague": {
      optionalBoundaries: [
        { id: "no-afterparty", text: "Work events end when the work ends for me." },
        { id: "cc-culture", text: "Keep decisions documented where others can see them." },
      ],
      freedomIds: ["study-cowork", "logistics-only", "public-polite", "lots-of-space"],
    },
    "spectrum:coexist": {
      optionalBoundaries: [
        { id: "no-forced-bonding", text: "Do not engineer hangouts to “fix us.”" },
      ],
      freedomIds: ["public-polite", "lots-of-space", "group-hangs", "monthly-catchups"],
    },
    "spectrum:friendly": {
      optionalBoundaries: [
        { id: "no-jealousy-frame", text: "My other friendships aren’t a competition." },
        { id: "clear-invites", text: "Invite me with a clear plan and an easy out." },
      ],
      freedomIds: [
        "movie-nights",
        "weekly-hangouts",
        "monthly-catchups",
        "shared-meals",
        "long-walks",
        "gaming",
        "group-hangs",
        "one-on-one",
        "voice-notes",
      ],
    },
    "spectrum:crush": {
      optionalBoundaries: [
        { id: "define-pace", text: "Let’s name a pace out loud instead of guessing." },
        { id: "no-breadcrumb", text: "If interest fades, say so — don’t breadcrumb." },
      ],
      freedomIds: [
        "movie-nights",
        "one-on-one",
        "shared-meals",
        "long-walks",
        "good-morning-texts",
        "deep-talks",
        "voice-notes",
        "planned-plans",
        "honesty-hour",
      ],
    },
    "spectrum:curious": {
      optionalBoundaries: [
        { id: "label-later", text: "We don’t need a label yet — but we do need honesty." },
        { id: "other-people-ok", text: "Seeing other people is okay until we say otherwise." },
      ],
      freedomIds: [
        "monthly-catchups",
        "spontaneous-plans",
        "movie-nights",
        "light-company",
        "shared-meals",
        "one-on-one",
        "lots-of-space",
      ],
    },
    "spectrum:dear-friend": {
      optionalBoundaries: [
        { id: "partner-respect", text: "Respect my partners and other close people." },
        { id: "no-romance-retry", text: "Don’t periodically “check” if romance is available now." },
      ],
      freedomIds: [
        "weekly-hangouts",
        "movie-nights",
        "shared-meals",
        "deep-talks",
        "celebration",
        "voice-notes",
        "hugs",
        "quiet-company",
        "one-on-one",
      ],
    },
    "spectrum:chosen-family": {
      optionalBoundaries: [
        { id: "ask-before-dropin", text: "Ask before dropping by, even if you’re family-to-me." },
        { id: "repair-fast", text: "If we hurt each other, we repair — we don’t exile in silence forever." },
      ],
      freedomIds: [
        "celebration",
        "weekly-hangouts",
        "shared-meals",
        "deep-talks",
        "check-ins",
        "honesty-hour",
        "hugs",
        "monthly-catchups",
      ],
    },
    "spectrum:romantic-love": {
      optionalBoundaries: [
        { id: "solo-time", text: "Solo time is part of loving you well." },
        { id: "phone-privacy", text: "Phone privacy stands unless we agree otherwise." },
      ],
      freedomIds: [
        "movie-nights",
        "weekly-hangouts",
        "shared-meals",
        "good-morning-texts",
        "deep-talks",
        "long-walks",
        "hugs",
        "honesty-hour",
        "celebration",
        "quiet-company",
      ],
    },
    "crush:send": {
      optionalBoundaries: [
        { id: "no-deadline", text: "There’s no deadline on their answer." },
        { id: "private-send", text: "Keep this between us unless they choose to share." },
      ],
      freedomIds: ["honesty-hour", "lots-of-space", "check-ins"],
    },
    "crush:mutual": {
      optionalBoundaries: [
        { id: "public-pace", text: "We decide together how public this becomes." },
        { id: "no-possession", text: "Mutual crush isn’t ownership of time or attention." },
      ],
      freedomIds: [
        "movie-nights",
        "one-on-one",
        "shared-meals",
        "good-morning-texts",
        "long-walks",
        "honesty-hour",
        "planned-plans",
      ],
    },
    "crush:friend": {
      optionalBoundaries: [
        { id: "friendship-reset", text: "We can reset to friendship without a guilt trip." },
      ],
      freedomIds: [
        "monthly-catchups",
        "group-hangs",
        "movie-nights",
        "light-company",
        "lots-of-space",
        "voice-notes",
      ],
    },
    "crush:ew": {
      optionalBoundaries: [
        { id: "no-explain-essay", text: "I don’t owe a long explanation beyond this no." },
      ],
      freedomIds: ["lots-of-space", "public-polite", "logistics-only"],
    },
    "crush:uncertain": {
      optionalBoundaries: [
        { id: "one-checkin", text: "One gentle check-in is okay; a campaign is not." },
      ],
      freedomIds: ["lots-of-space", "light-company", "monthly-catchups", "honesty-hour"],
    },
  },
};

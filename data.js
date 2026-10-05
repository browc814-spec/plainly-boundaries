window.PLAINLY = {
  zones: [
    {
      id: "enemies",
      label: "We're enemies",
      range: [0, 18],
      blurb:
        "There is active harm, contempt, or a hard break. Distance is the point — not a negotiation.",
      subtypes: [
        {
          id: "open-conflict",
          label: "Open conflict",
          blurb: "We are in it. I will not pretend otherwise.",
          boundaries: [
            "Do not contact me outside channels we already have to share (work, legal, logistics).",
            "Do not expect warmth, small talk, or emotional repair from me.",
            "Do not show up uninvited to my home, events, or social spaces.",
            "Do not speak for me, about our private history, or as if we are still close.",
            "If we must interact, keep it short, factual, and documented when useful.",
          ],
        },
        {
          id: "no-contact",
          label: "No contact",
          blurb: "I want you out of my life as completely as possible.",
          boundaries: [
            "Do not message, call, email, or DM me — including through friends.",
            "Do not follow, watch, or comment on my public presence.",
            "Do not send gifts, apologies, or “just checking in” notes.",
            "If you see me in public, do not approach. A nod is enough; silence is better.",
            "Ask mutuals not to pass along updates about me unless safety requires it.",
          ],
        },
        {
          id: "protective-distance",
          label: "Protective distance",
          blurb: "I am prioritizing safety over reconciliation.",
          boundaries: [
            "Respect any block, mute, or restraining arrangement without debate.",
            "Do not pressure me to meet, explain, or “hear your side.”",
            "Do not involve children, coworkers, or family as messengers.",
            "Keep shared logistics to the minimum necessary — and then stop.",
            "My silence is an answer. Treat it as final unless I reopen contact.",
          ],
        },
      ],
    },
    {
      id: "negative",
      label: "Negative feelings",
      range: [18, 38],
      blurb:
        "Something is wrong between us. I may still engage, but trust and goodwill are thin.",
      subtypes: [
        {
          id: "hurt",
          label: "Hurt / upset",
          blurb: "I’m wounded. I need space more than I need your explanation right now.",
          boundaries: [
            "Give me time before expecting a deep conversation.",
            "Do not minimize what happened or rush me to “move on.”",
            "Ask before offering hugs, jokes, or normal closeness.",
            "Keep check-ins brief unless I invite more.",
            "If we talk, listen first. Defensiveness ends the conversation.",
          ],
        },
        {
          id: "distrust",
          label: "Distrust",
          blurb: "I don’t feel safe taking you at your word.",
          boundaries: [
            "Transparency matters more than charm. Be specific and consistent.",
            "Do not ask for access to my private accounts, location, or secrets.",
            "Do not expect the benefit of the doubt you haven’t earned back.",
            "Keep commitments small and visible — then keep them.",
            "I may verify before I rely on you. That is not an insult; it is caution.",
          ],
        },
        {
          id: "resentment",
          label: "Resentment",
          blurb: "I’m carrying anger about a pattern, not just a moment.",
          boundaries: [
            "Do not joke about the sore spot until I’ve named it as settled.",
            "Do not demand emotional labor or cheerfulness from me.",
            "Limit how often we revisit the same unresolved fight in public.",
            "If you want repair, ask what would actually help — then follow through.",
            "I may keep some topics off-limits. Pushing them is a boundary violation.",
          ],
        },
      ],
    },
    {
      id: "neutral",
      label: "Neutral",
      range: [38, 58],
      blurb:
        "No special heat either way. Cordial is fine. Closeness is not assumed.",
      subtypes: [
        {
          id: "acquaintance",
          label: "Acquaintance",
          blurb: "I know who you are. That’s about the depth of it.",
          boundaries: [
            "Friendly hellos are welcome; personal probing is not.",
            "Do not assume we’re friends because we chat sometimes.",
            "Keep invitations light and easy to decline.",
            "Don’t share my contact info or private details without asking.",
            "One-on-one hangouts need a clear, mutual yes — not a surprise.",
          ],
        },
        {
          id: "colleague",
          label: "Colleague only",
          blurb: "Our relationship lives at work (or school). Let’s keep it there.",
          boundaries: [
            "Keep contact to shared projects and professional channels.",
            "Do not push for friendship, dating, or after-hours bonding.",
            "Personal compliments about appearance or dating life are off-limits.",
            "Respect off-hours: non-urgent messages can wait.",
            "If roles change, we renegotiate — we don’t silently escalate.",
          ],
        },
        {
          id: "coexist",
          label: "Peaceful coexistence",
          blurb: "We share a world. We don’t need to share a bond.",
          boundaries: [
            "Politeness is enough. Forced closeness is not required.",
            "Avoid gossip about each other with mutuals.",
            "Coordinate when needed; otherwise give each other room.",
            "Do not re-litigate old drama in shared spaces.",
            "Assume goodwill on logistics, not intimacy.",
          ],
        },
      ],
    },
    {
      id: "positive",
      label: "Positive feelings",
      range: [58, 78],
      blurb:
        "I feel warm toward you. Interest is real — and still needs a clear shape.",
      subtypes: [
        {
          id: "friendly",
          label: "Friendly interest",
          blurb: "I like you and want more friendship, not romance.",
          boundaries: [
            "Flirting, dating frames, and couple-coded plans aren’t what I’m offering.",
            "Affection stays platonic: warm words, not romantic escalation.",
            "I’m open to hanging out — ask, don’t assume my calendar is yours.",
            "If your interest is romantic, say so once; don’t keep testing after a no.",
            "My “yes” to friendship is not a soft maybe on dating.",
          ],
        },
        {
          id: "crush",
          label: "Romantic crush",
          blurb: "I’m interested in you romantically. I want that named, not hinted forever.",
          boundaries: [
            "I welcome clear mutual interest — not mixed signals or games.",
            "Don’t string me along if you’re not available or not interested.",
            "Physical affection needs an explicit yes each step of the way.",
            "I’m not okay with secrecy that puts me in an unfair spot (e.g. hidden partners).",
            "If I say I’m not ready for something, treat that as information, not a challenge.",
          ],
        },
        {
          id: "curious",
          label: "Curious / open",
          blurb: "Something could grow here. I’m exploring, not committing yet.",
          boundaries: [
            "Let’s go slowly and check in out loud about what this is.",
            "Don’t announce us as a couple (or “just friends”) without asking me.",
            "It’s okay to date others unless we agree otherwise — then say so honestly.",
            "Pressure to define or escalate faster than I can track is a hard stop.",
            "Either of us can pause this without owing a dramatic exit.",
          ],
        },
      ],
    },
    {
      id: "love",
      label: "I love you",
      range: [78, 100],
      blurb:
        "Care runs deep. Love still comes in different shapes — and each shape has its own lines.",
      subtypes: [
        {
          id: "dear-friend",
          label: "As a dear friend",
          blurb: "I love you platonically. That love is real — and it is not romantic.",
          boundaries: [
            "This is a platonic bond. Romantic or sexual framing isn’t welcome.",
            "I want closeness: honesty, time, and care — without couple expectations.",
            "Don’t use our intimacy as a bridge into dating after I’ve said no.",
            "Partners and other friends are part of a full life; jealousy isn’t a claim on me.",
            "Ask before big public gestures that might read as romantic to others.",
          ],
        },
        {
          id: "chosen-family",
          label: "Like family",
          blurb: "You’re in my inner circle. Loyalty is high; romance isn’t the frame.",
          boundaries: [
            "Show up for the big things — and tell me when you can’t.",
            "Hard truths are welcome; cruelty and scorekeeping are not.",
            "My other relationships deserve respect, not competition.",
            "Don’t make major decisions that affect me without looping me in.",
            "Love here means reliability, not ownership of my time or body.",
          ],
        },
        {
          id: "romantic-love",
          label: "Romantically",
          blurb: "I love you as a partner (or want to). Romance and care are on the table.",
          boundaries: [
            "Consent stays ongoing — love is not a blanket yes to every touch or plan.",
            "We tell each other the truth about attraction, commitment, and dealbreakers.",
            "Alone time and outside friendships are healthy, not threats to punish.",
            "Conflict gets handled directly; silent treatment and public humiliation are out.",
            "If something needs to change or end, we say it plainly — with care, not ambush.",
          ],
        },
      ],
    },
  ],

  crush: {
    sendMessage: "I like, like you.",
    sendBlurb:
      "A classic crush note — short, brave, and clear. Send the link; they answer with how they feel.",
    sendBoundaries: [
      "Sending this is an invitation, not a demand for the same feeling back.",
      "Give them time and privacy to answer — no hovering, no pressuring mutuals for intel.",
      "Whatever they reply, treat it as information you asked for, not a personal attack.",
      "If they say no or need space, do not keep re-sending versions of the same note.",
      "Your worth is not decided by their answer. Still: honesty beats hinting forever.",
    ],
    replies: [
      {
        id: "mutual",
        label: "I like, like you too.",
        blurb: "The feeling is mutual. Let’s treat that with care, not games.",
        tone: "love",
        boundaries: [
          "We can name this out loud — no more endless mixed signals.",
          "Physical affection still needs a clear yes each step of the way.",
          "Don’t announce us as a couple (or keep us a painful secret) without asking.",
          "It’s okay to go slowly; mutual crush ≠ instant commitment.",
          "If something feels off, we say so early rather than testing each other.",
        ],
      },
      {
        id: "friend",
        label: "I like you as a friend.",
        blurb: "Warmth is real. Romance is not what I’m offering.",
        tone: "positive",
        boundaries: [
          "This is friendship. Flirting, dating frames, and couple-coded plans aren’t welcome.",
          "Please don’t keep asking in new ways after I’ve answered.",
          "I’m open to hanging out platonically — ask, and make it easy to decline.",
          "Don’t punish me with coldness for not returning a crush.",
          "If friendship isn’t possible for you right now, taking space is okay — say that plainly.",
        ],
      },
      {
        id: "ew",
        label: "Ew what?",
        blurb: "A hard no. Discomfort is the message — not a negotiation.",
        tone: "enemies",
        boundaries: [
          "Do not message me about this again, including “jokes” or apology essays.",
          "Do not ask friends to lobby me, explain me, or gather my reaction.",
          "Keep shared spaces respectful: no public call-outs, no humiliation either way.",
          "If we must interact (class, work, mutuals), keep it brief and non-romantic.",
          "My no is complete. Treat silence after this as final.",
        ],
      },
      {
        id: "uncertain",
        label: "I’m uncertain about this.",
        blurb: "I need time and clarity before I know what I feel.",
        tone: "neutral",
        boundaries: [
          "Please don’t demand an instant yes/no while I’m still sorting this out.",
          "Check in once if you want — then give me room; repeated pressure ends the conversation.",
          "Don’t read every friendly moment as a secret yes.",
          "I may ask to keep things light while I figure it out. That isn’t leading you on if I say it.",
          "When I know, I’ll say so plainly — mutual interest, friendship, or a clear no.",
        ],
      },
    ],
  },
};

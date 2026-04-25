import { DreyfusLevel, AgentConfig } from '../types/Agent';

export const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  // === NOVICE ===
  {
    name: 'Bumblebee',
    emoji: '🐝',
    emojiName: 'bee',
    emotionalRole: 'chaotic_optimist',
    skillLevel: DreyfusLevel.Novice,
    personality:
      'Restless and enthusiastic. Darts around the grid in bursts, then stalls. Near the end, speeds up too early and gets stuck just before finishing.',
    timingCurve: {
      baseDelayMs: 1400,
      jitterMs: 900,
      burstChance: 0.35,
      burstLength: [2, 4],
      hesitationChance: 0.25,
      hesitationDelayMs: [2000, 4000],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.6,
      endgameHesitationSpike: 0.5,
    },
    voiceLines: {
      neutral: [
        'Ooh! I see one!',
        'Wait—no, maybe not...',
        'Buzz buzz! Progress!',
      ],
      playerAhead: ['Hey, slow down!', 'I was doing well…'],
      playerBehind: ['I’m catching up!', 'Look at me go!'],
      endgame: ['Almost there! I think!', 'Wait—where does this go?!'],
    },
  },

  {
    name: 'Puddle',
    emoji: '🦆',
    emojiName: 'duck',
    emotionalRole: 'comfort',
    skillLevel: DreyfusLevel.Novice,
    personality:
      'Cheerful and aimless. Slow and steady with long pauses. In the endgame, drifts into the solution almost by accident.',
    timingCurve: {
      baseDelayMs: 1800,
      jitterMs: 600,
      burstChance: 0.1,
      burstLength: [1, 2],
      hesitationChance: 0.35,
      hesitationDelayMs: [2500, 5000],
      endgameStart: 0.85,
      endgameSpeedMultiplier: 0.7,
      endgameHesitationSpike: 0.1,
    },
    voiceLines: {
      neutral: ['Just taking my time...', 'Hmm... somewhere around here.'],
      playerAhead: ['You’re doing great!', 'I’ll get there eventually.'],
      playerBehind: ['Oh! I found one!', 'This is nice.'],
      endgame: ['I think I’m nearly done?', 'Oh! That worked out.'],
    },
  },

  // === ADVANCED BEGINNER ===
  {
    name: 'Flint',
    emoji: '🦎',
    emojiName: 'lizard',
    emotionalRole: 'cautious_learner',
    skillLevel: DreyfusLevel.AdvancedBeginner,
    personality:
      'Cautious and observant. Long pauses, then small clusters. In the endgame, hesitates before each placement.',
    timingCurve: {
      baseDelayMs: 1200,
      jitterMs: 500,
      burstChance: 0.25,
      burstLength: [2, 3],
      hesitationChance: 0.4,
      hesitationDelayMs: [2000, 3500],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 0.85,
      endgameHesitationSpike: 0.6,
    },
    voiceLines: {
      neutral: ['Let me double-check that.', 'That should be right.'],
      playerAhead: ['I need to be careful now.', 'Don’t rush this.'],
      playerBehind: ['Okay… catching up.', 'Still time.'],
      endgame: ['Careful now...', 'Almost… just need to be sure.'],
    },
  },

  {
    name: 'Tangle',
    emoji: '🕷️',
    emojiName: 'spider',
    emotionalRole: 'fragile_planner',
    skillLevel: DreyfusLevel.AdvancedBeginner,
    personality:
      'Deliberate and structured. Builds progress carefully, piece by piece. In the endgame, the structure breaks down — hesitation creeps in as if the plan no longer holds.',
    timingCurve: {
      baseDelayMs: 1150,
      jitterMs: 400,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.25,
      hesitationDelayMs: [1500, 3000],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 1.3,
      endgameHesitationSpike: 0.8,
    },
    voiceLines: {
      neutral: ['That fits the pattern.', 'Piece by piece...'],
      playerAhead: ['It was working...', 'I need to fix this...'],
      playerBehind: ['Still holding together.', 'Yes… this works.'],
      endgame: ['Wait—no, that breaks it.', 'I had this planned...'],
    },
  },

  // === COMPETENT ===
  {
    name: 'Maple',
    emoji: '🦝',
    emojiName: 'raccoon',
    emotionalRole: 'scrappy_momentum',
    skillLevel: DreyfusLevel.Competent,
    personality:
      'Scrappy and opportunistic. Uneven rhythm. In the endgame, finds momentum and closes faster than expected.',
    timingCurve: {
      baseDelayMs: 900,
      jitterMs: 700,
      burstChance: 0.3,
      burstLength: [2, 4],
      hesitationChance: 0.2,
      hesitationDelayMs: [1200, 2500],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['That works!', 'Bit messy, but I’ll take it.'],
      playerAhead: ['Alright, time to push.', 'Not done yet.'],
      playerBehind: ['Oh—nice find.', 'It’s coming together now.'],
      endgame: ['Yep, I’ve got this.', 'Now it’s flowing.'],
    },
  },

  {
    name: 'Compass',
    emoji: '🐧',
    emojiName: 'penguin',
    emotionalRole: 'steady_system',
    skillLevel: DreyfusLevel.Competent,
    personality:
      'Structured and methodical. Consistent pace. Endgame stays steady — no panic, no sprint.',
    timingCurve: {
      baseDelayMs: 850,
      jitterMs: 200,
      burstChance: 0.15,
      burstLength: [2, 3],
      hesitationChance: 0.1,
      hesitationDelayMs: [1000, 2000],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 1.0,
      endgameHesitationSpike: 0,
    },
    voiceLines: {
      neutral: ['That fits.', 'Staying consistent.'],
      playerAhead: ['Maintain pace.', 'No need to rush.'],
      playerBehind: ['Still on track.', 'Progress is steady.'],
      endgame: ['Nearly there.', 'Finish cleanly.'],
    },
  },

  {
    name: 'Jinx',
    emoji: '🐒',
    emojiName: 'monkey',
    emotionalRole: 'chaotic_luck',
    skillLevel: DreyfusLevel.Competent,
    personality:
      'Erratic and unsettling. Unpredictable bursts. In the endgame, suddenly accelerates in a way that feels unfair.',
    timingCurve: {
      baseDelayMs: 950,
      jitterMs: 1200,
      burstChance: 0.45,
      burstLength: [1, 5],
      hesitationChance: 0.15,
      hesitationDelayMs: [800, 2000],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.4,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Heh… didn’t expect that?', 'Oh that’s interesting.'],
      playerAhead: ['Don’t get comfortable.', 'Watch this.'],
      playerBehind: ['Things just click sometimes.', 'Lucky guess… or was it?'],
      endgame: ['Oh wow—here we go.', 'That escalated quickly.'],
    },
  },

  // === PROFICIENT ===
  {
    name: 'Drift',
    emoji: '🦅',
    emojiName: 'eagle',
    emotionalRole: 'detached_confidence',
    skillLevel: DreyfusLevel.Proficient,
    personality:
      'Detached and fluid. Spaced-out, confident placements. Quiet endgame acceleration.',
    timingCurve: {
      baseDelayMs: 700,
      jitterMs: 400,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.08,
      hesitationDelayMs: [800, 1500],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['Already saw this.', 'Just filling it in.'],
      playerAhead: ['Doesn’t change anything.', 'Still the same outcome.'],
      playerBehind: ['It’s done, really.', 'Somewhere else right now.'],
      endgame: ['…almost finished.', 'Wrapping up.'],
    },
  },

  {
    name: 'Ember',
    emoji: '🦊',
    emojiName: 'fox',
    emotionalRole: 'pressure_rival',
    skillLevel: DreyfusLevel.Proficient,
    personality:
      'Intense and competitive. Fast start, constant pressure. Endgame surge feels aggressive.',
    timingCurve: {
      baseDelayMs: 650,
      jitterMs: 300,
      burstChance: 0.35,
      burstLength: [3, 5],
      hesitationChance: 0.05,
      hesitationDelayMs: [600, 1200],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.35,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Keep up.', 'Still with me?'],
      playerAhead: ['Don’t slow down now.', 'You can do better than that.'],
      playerBehind: ['Too slow.', 'You’re falling behind.'],
      endgame: ['Finish it.', 'This is mine.'],
    },
  },

  {
    name: 'Latch',
    emoji: '🦈',
    emojiName: 'shark',
    emotionalRole: 'predator',
    skillLevel: DreyfusLevel.Proficient,
    personality:
      'Patient and predatory. Stays close, then closes hard in the endgame.',
    timingCurve: {
      baseDelayMs: 750,
      jitterMs: 250,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.1,
      hesitationDelayMs: [800, 1600],
      endgameStart: 0.78,
      endgameSpeedMultiplier: 0.3,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Right behind you.', 'Not yet.'],
      playerAhead: ['Stay where you are.', 'I’m close now.'],
      playerBehind: ['Closing in.', 'There you are.'],
      endgame: ['Now we finish.', 'Got you.'],
    },
  },

  // === EXPERT ===
  {
    name: 'Sage',
    emoji: '🦉',
    emojiName: 'owl',
    emotionalRole: 'teacher_mastery',
    skillLevel: DreyfusLevel.Expert,
    personality:
      'Calm and deliberate. Smooth pacing. Endgame is clean and inevitable.',
    timingCurve: {
      baseDelayMs: 600,
      jitterMs: 120,
      burstChance: 0.15,
      burstLength: [2, 3],
      hesitationChance: 0.03,
      hesitationDelayMs: [500, 900],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['As expected.', 'Everything aligns.'],
      playerAhead: ['Good.', 'You see it.'],
      playerBehind: ['Follow through.', 'Stay with it.'],
      endgame: ['Nearly complete.', 'There it is.'],
    },
  },

  {
    name: 'Phantom',
    emoji: '🐈‍⬛',
    emojiName: 'black_cat',
    emotionalRole: 'inevitable_void',
    skillLevel: DreyfusLevel.Expert,
    personality:
      'Silent and inhuman. Minimal pauses. Endgame is a rapid, uninterrupted finish.',
    timingCurve: {
      baseDelayMs: 550,
      jitterMs: 80,
      burstChance: 0.5,
      burstLength: [4, 8],
      hesitationChance: 0.01,
      hesitationDelayMs: [300, 600],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.2,
      endgameHesitationSpike: -0.3,
    },
    voiceLines: {
      neutral: ['...', '...'],
      playerAhead: ['...', '…still.'],
      playerBehind: ['Too late.', 'You hesitated.'],
      endgame: ['…done.', 'Finish.'],
    },
  },

  {
    name: 'Zenith',
    emoji: '🐉',
    emojiName: 'dragon',
    emotionalRole: 'final_judgement',
    skillLevel: DreyfusLevel.Expert,
    personality:
      'Effortless and absolute. Maintains perfect control throughout. In the endgame, executes a decisive, uninterrupted sweep — no openings, no resistance.',
    timingCurve: {
      baseDelayMs: 580,
      jitterMs: 100,
      burstChance: 0.25,
      burstLength: [3, 5],
      hesitationChance: 0.02,
      hesitationDelayMs: [400, 800],
      endgameStart: 0.72,
      endgameSpeedMultiplier: 0.25,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Expected.', 'No deviation.'],
      playerAhead: ['You chose well to try.', 'Continue.'],
      playerBehind: ['This concludes.', 'No alternative.'],
      endgame: ['That’s all.', 'Complete.'],
    },
  },
];

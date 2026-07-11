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
      'Restless and enthusiastic. Slides blocks around in bursts, then stalls. Near the exit, speeds up too early and jams the lane just before finishing.',
    timingCurve: {
      baseDelayMs: 4200,
      jitterMs: 2700,
      burstChance: 0.35,
      burstLength: [2, 4],
      hesitationChance: 0.25,
      hesitationDelayMs: [6000, 12000],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.6,
      endgameHesitationSpike: 0.5,
    },
    voiceLines: {
      neutral: [
        'Ooh! This one slides!',
        'Wait—no, that blocks me...',
        'Buzz buzz! Making room!',
      ],
      playerAhead: ['Hey, slow down!', 'I was clearing a path…'],
      playerBehind: ['I’m catching up!', 'Look at me slide!'],
      endgame: ['The exit! I see it!', 'Wait—who parked that there?!'],
    },
  },

  {
    name: 'Puddle',
    emoji: '🦆',
    emojiName: 'duck',
    emotionalRole: 'comfort',
    skillLevel: DreyfusLevel.Novice,
    personality:
      'Cheerful and aimless. Slow and steady with long pauses. In the endgame, drifts out of the gridlock almost by accident.',
    timingCurve: {
      baseDelayMs: 5400,
      jitterMs: 1800,
      burstChance: 0.1,
      burstLength: [1, 2],
      hesitationChance: 0.35,
      hesitationDelayMs: [7500, 15000],
      endgameStart: 0.85,
      endgameSpeedMultiplier: 0.7,
      endgameHesitationSpike: 0.1,
    },
    voiceLines: {
      neutral: ['Just nudging things along...', 'Hmm... maybe this block.'],
      playerAhead: ['You’re doing great!', 'I’ll get out eventually.'],
      playerBehind: ['Oh! That one moved!', 'This is nice.'],
      endgame: ['Is that the exit?', 'Oh! The road cleared itself.'],
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
      'Cautious and observant. Long pauses, then small clusters of slides. In the endgame, hesitates before each move.',
    timingCurve: {
      baseDelayMs: 3600,
      jitterMs: 1500,
      burstChance: 0.25,
      burstLength: [2, 3],
      hesitationChance: 0.4,
      hesitationDelayMs: [6000, 10500],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 0.85,
      endgameHesitationSpike: 0.6,
    },
    voiceLines: {
      neutral: [
        'Let me check what that frees up.',
        'That slide should be safe.',
      ],
      playerAhead: ['I need to be careful now.', 'Don’t jam the lane.'],
      playerBehind: ['Okay… catching up.', 'Still time.'],
      endgame: ['Careful now...', 'Almost out… just need to be sure.'],
    },
  },

  {
    name: 'Tangle',
    emoji: '🕷️',
    emojiName: 'spider',
    emotionalRole: 'fragile_planner',
    skillLevel: DreyfusLevel.AdvancedBeginner,
    personality:
      'Deliberate and structured. Clears the lane carefully, block by block. In the endgame, the plan breaks down — hesitation creeps in as if the route no longer holds.',
    timingCurve: {
      baseDelayMs: 3450,
      jitterMs: 1200,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.25,
      hesitationDelayMs: [4500, 9000],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 1.3,
      endgameHesitationSpike: 0.8,
    },
    voiceLines: {
      neutral: ['That opens the route.', 'Block by block...'],
      playerAhead: ['The route was working...', 'I need to re-plan...'],
      playerBehind: ['Still holding together.', 'Yes… the lane is opening.'],
      endgame: [
        'Wait—no, that blocks me back in.',
        'I had this route planned...',
      ],
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
      'Scrappy and opportunistic. Uneven rhythm. In the endgame, finds momentum and slides out faster than expected.',
    timingCurve: {
      baseDelayMs: 2700,
      jitterMs: 2100,
      burstChance: 0.3,
      burstLength: [2, 4],
      hesitationChance: 0.2,
      hesitationDelayMs: [3600, 7500],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['That shifts it!', 'Bit of a squeeze, but I’ll take it.'],
      playerAhead: ['Alright, time to push.', 'Not boxed in yet.'],
      playerBehind: ['Oh—nice gap.', 'The lane’s opening up now.'],
      endgame: ['Yep, clear road ahead.', 'Now it’s rolling.'],
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
      baseDelayMs: 2550,
      jitterMs: 600,
      burstChance: 0.15,
      burstLength: [2, 3],
      hesitationChance: 0.1,
      hesitationDelayMs: [3000, 6000],
      endgameStart: 0.8,
      endgameSpeedMultiplier: 1.0,
      endgameHesitationSpike: 0,
    },
    voiceLines: {
      neutral: ['That slide fits the route.', 'Staying consistent.'],
      playerAhead: ['Maintain pace.', 'No need to rush the grid.'],
      playerBehind: ['Still on track.', 'The lane clears steadily.'],
      endgame: ['Nearly through.', 'Exit cleanly.'],
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
      baseDelayMs: 2850,
      jitterMs: 3600,
      burstChance: 0.45,
      burstLength: [1, 5],
      hesitationChance: 0.15,
      hesitationDelayMs: [2400, 6000],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.4,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Heh… didn’t see that gap?', 'Oh that’s an interesting slide.'],
      playerAhead: ['Don’t get comfortable.', 'Watch this move.'],
      playerBehind: [
        'Traffic just parts sometimes.',
        'Lucky slide… or was it?',
      ],
      endgame: ['Oh wow—the road’s wide open.', 'That cleared quickly.'],
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
      'Detached and fluid. Spaced-out, confident slides. Quiet endgame acceleration.',
    timingCurve: {
      baseDelayMs: 2100,
      jitterMs: 1200,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.08,
      hesitationDelayMs: [2400, 4500],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['Already saw the route.', 'Just sliding through it.'],
      playerAhead: ['Doesn’t change the route.', 'Same exit either way.'],
      playerBehind: ['It’s cleared, really.', 'Coasting from here.'],
      endgame: ['…almost out.', 'Rolling to the exit.'],
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
      baseDelayMs: 1950,
      jitterMs: 900,
      burstChance: 0.35,
      burstLength: [3, 5],
      hesitationChance: 0.05,
      hesitationDelayMs: [1800, 3600],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.35,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Keep up.', 'Still stuck in traffic?'],
      playerAhead: ['Don’t stall now.', 'You can slide faster than that.'],
      playerBehind: ['Too slow.', 'You’re boxed in.'],
      endgame: ['Clear the lane.', 'This exit is mine.'],
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
      baseDelayMs: 2250,
      jitterMs: 750,
      burstChance: 0.2,
      burstLength: [2, 3],
      hesitationChance: 0.1,
      hesitationDelayMs: [2400, 4800],
      endgameStart: 0.78,
      endgameSpeedMultiplier: 0.3,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Right behind you.', 'Not yet.'],
      playerAhead: ['Stay in your lane.', 'I’m close now.'],
      playerBehind: ['Closing in.', 'There’s the gap.'],
      endgame: ['Now we slide out.', 'Got the exit.'],
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
      baseDelayMs: 1650,
      jitterMs: 360,
      burstChance: 0.15,
      burstLength: [2, 3],
      hesitationChance: 0.03,
      hesitationDelayMs: [1500, 2700],
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.5,
      endgameHesitationSpike: -0.1,
    },
    voiceLines: {
      neutral: ['As expected.', 'Every block in its place.'],
      playerAhead: ['Good.', 'You see the route.'],
      playerBehind: ['Follow the lane.', 'Stay with it.'],
      endgame: ['Nearly through.', 'There’s the exit.'],
    },
  },

  {
    name: 'Phantom',
    emoji: '🐈‍⬛',
    emojiName: 'black_cat',
    emotionalRole: 'inevitable_void',
    skillLevel: DreyfusLevel.Expert,
    personality:
      'Silent and inhuman. Minimal pauses. Endgame is a rapid, uninterrupted slide to the exit.',
    timingCurve: {
      baseDelayMs: 1650,
      jitterMs: 240,
      burstChance: 0.5,
      burstLength: [4, 8],
      hesitationChance: 0.01,
      hesitationDelayMs: [900, 1800],
      endgameStart: 0.7,
      endgameSpeedMultiplier: 0.2,
      endgameHesitationSpike: -0.3,
    },
    voiceLines: {
      neutral: ['...', '...'],
      playerAhead: ['...', '…still.'],
      playerBehind: ['Too late.', 'You hesitated.'],
      endgame: ['…out.', 'Exit.'],
    },
  },

  {
    name: 'Zenith',
    emoji: '🐉',
    emojiName: 'dragon',
    emotionalRole: 'final_judgement',
    skillLevel: DreyfusLevel.Expert,
    personality:
      'Effortless and absolute. Maintains perfect control throughout. In the endgame, executes a decisive, uninterrupted sweep to the exit — no openings, no resistance.',
    timingCurve: {
      baseDelayMs: 1740,
      jitterMs: 300,
      burstChance: 0.25,
      burstLength: [3, 5],
      hesitationChance: 0.02,
      hesitationDelayMs: [1200, 2400],
      endgameStart: 0.72,
      endgameSpeedMultiplier: 0.25,
      endgameHesitationSpike: -0.2,
    },
    voiceLines: {
      neutral: ['Expected.', 'No deviation.'],
      playerAhead: ['You chose well to try.', 'Continue.'],
      playerBehind: ['This concludes.', 'No alternative.'],
      endgame: ['That’s all.', 'Clear.'],
    },
  },
];

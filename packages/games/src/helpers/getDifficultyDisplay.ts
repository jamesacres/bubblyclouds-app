export const getDifficultyDisplay = (difficulty: string) => {
  // Map both Difficulty enum and BookPuzzleDifficulty enum values
  const difficultyMap: {
    [key: string]: { name: string; badgeColor: string };
  } = {
    // Standard difficulties (from Difficulty enum)
    simple: { name: '⚡️ Tricky', badgeColor: 'bg-green-500 text-white' },
    easy: { name: '🔥 Challenging', badgeColor: 'bg-yellow-500 text-white' },
    intermediate: {
      name: '🚀 Hard',
      badgeColor: 'bg-red-500 text-white',
    },
    expert: { name: '🔴 Expert', badgeColor: 'bg-red-500 text-white' },

    // Book difficulties (from BookPuzzleDifficulty enum)
    '1-very-easy': {
      name: '🟢 Very Easy',
      badgeColor: 'bg-green-400 text-white',
    },
    '2-easy': { name: '🟢 Easy', badgeColor: 'bg-green-500 text-white' },
    '3-moderately-easy': {
      name: '🟡 Moderately Easy',
      badgeColor: 'bg-lime-600 text-white',
    },
    '4-moderate': {
      name: '🟡 Moderate',
      badgeColor: 'bg-yellow-600 text-white',
    },
    '5-moderately-hard': {
      name: '🟠 Moderately Hard',
      badgeColor: 'bg-orange-500 text-white',
    },
    '6-hard': { name: '🔴 Hard', badgeColor: 'bg-red-500 text-white' },
    '7-vicious': { name: '🔥 Vicious', badgeColor: 'bg-red-600 text-white' },
    '8-fiendish': { name: '🔥 Fiendish', badgeColor: 'bg-red-700 text-white' },
    '9-devilish': { name: '🔥 Devilish', badgeColor: 'bg-red-800 text-white' },
    '10-hell': { name: '🔥🔥 Hell', badgeColor: 'bg-red-900 text-white' },
    '11-beyond-hell': {
      name: '🔥🔥🔥 Beyond Hell',
      badgeColor: 'bg-black text-white',
    },
  };

  return (
    difficultyMap[difficulty] || {
      name: difficulty,
      badgeColor: 'bg-gray-500 text-white',
    }
  );
};

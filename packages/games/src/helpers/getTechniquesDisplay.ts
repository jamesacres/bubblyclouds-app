export type Techniques = Partial<{
  basic: Partial<{ [key: string]: number }>;
  simple: Partial<{ [key: string]: number }>;
  advanced: Partial<{ [key: string]: number }>;
  hard: Partial<{ [key: string]: number }>;
  brutal: Partial<{ [key: string]: number }>;
  beyondBrutal: Partial<{ [key: string]: number }>;
}>;

export const getTechniquesDisplay = (techniques?: Techniques) => {
  if (!techniques) return [];

  const techniqueNames: { [key: string]: string } = {
    // Basic
    lastDigit: 'Last Digit',
    hiddenSingleBox: 'Hidden Single (Box)',
    hiddenSingleLine: 'Hidden Single (Line)',
    hiddenSingleVariantRegion: 'Hidden Single (Variant Region)',
    nakedSingle: 'Naked Single',
    // Simple
    hiddenPair: 'Hidden Pair',
    lockedCandidate: 'Locked Candidate',
    hiddenTriple: 'Hidden Triple',
    hiddenQuadruple: 'Hidden Quadruple',
    nakedPair: 'Naked Pair',
    nakedTriple: 'Naked Triple',
    nakedQuadruple: 'Naked Quadruple',
    // Advanced
    xWing: 'X-Wing',
    swordfish: 'Swordfish',
    skyscraper: 'Skyscraper',
    twoStringKite: 'Two-String-Kite',
    crane: 'Crane',
    simpleColoring: 'Simple Coloring',
    yWing: 'Y-Wing',
    xYZWing: 'XYZ-Wing',
    wWing: 'W-Wing',
    finnedSashimiXWing: 'Finned/Sashimi X-Wing',
    emptyRectangle: 'Empty Rectangle',
    uniqueRectangleType1: 'Unique Rectangle Type 1',
    uniqueRectangleType2: 'Unique Rectangle Type 2',
    uniqueRectangleType3: 'Unique Rectangle Type 3',
    uniqueRectangleType4: 'Unique Rectangle Type 4',
    uniqueRectangleType5: 'Unique Rectangle Type 5',
    // Hard
    finnedSashimiSwordfish: 'Finned/Sashimi Swordfish',
    jellyfish: 'Jellyfish',
    bugBinaryUniversalGrave: 'BUG (Binary Universal Grave)',
    xChain: 'X-Chain',
    groupedXChain: 'Grouped X-Chain',
    YWing4WXYZWing: '4-Y-Wing (WXYZ-Wing)',
    yWing5: '5-Y-Wing',
    yWing6: '6-Y-Wing',
    yWing7: '7-Y-Wing',
    yWing8: '8-Y-Wing',
    yWing9: '9-Y-Wing',
    finnedSashimiJellyfish: 'Finned/Sashimi Jellyfish',
    // Brutal
    medusa3D: '3D Medusa',
    xyChain: 'XY-Chain',
    alternatingInferenceChainAIC: 'Alternating Inference Chain (AIC)',
    groupedAlternatingInferenceChainAIC:
      'Grouped Alternating Inference Chain (AIC)',
    // Beyond Brutal
    nishioForcingChain: 'Nishio Forcing Chain',
    nishioForcingNet: 'Nishio Forcing Net',
  };

  const categoryColors: { [key: string]: string } = {
    beyondBrutal: 'bg-black text-white',
    brutal: 'bg-red-600 text-white',
    hard: 'bg-red-500 text-white',
    advanced: 'bg-yellow-500 text-white',
    simple: 'bg-blue-500 text-white',
    basic: 'bg-green-500 text-white',
  };

  const categoryOrder: { [key: string]: number } = {
    beyondBrutal: 0,
    brutal: 1,
    hard: 2,
    advanced: 3,
    simple: 4,
    basic: 5,
  };

  const allTechniques: Array<{
    name: string;
    count: number;
    color: string;
    category: string;
    categoryOrder: number;
  }> = [];

  Object.entries(techniques || {}).forEach(([category, categoryTechniques]) => {
    if (typeof categoryTechniques === 'object' && categoryTechniques !== null) {
      const color = categoryColors[category] || 'bg-gray-500 text-white';
      const order = categoryOrder[category] ?? 999;
      Object.entries(categoryTechniques).forEach(([technique, count]) => {
        if (count && (count as number) > 0) {
          const humanName = techniqueNames[technique] || technique;
          allTechniques.push({
            name: humanName,
            count: count as number,
            color,
            category,
            categoryOrder: order,
          });
        }
      });
    }
  });

  return allTechniques.sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) {
      return a.categoryOrder - b.categoryOrder;
    }
    return b.count - a.count;
  });
};

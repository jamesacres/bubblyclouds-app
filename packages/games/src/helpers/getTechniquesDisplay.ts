import { Translate } from '../types/i18n';

export type Techniques = Partial<{
  basic: Partial<{ [key: string]: number }>;
  simple: Partial<{ [key: string]: number }>;
  advanced: Partial<{ [key: string]: number }>;
  hard: Partial<{ [key: string]: number }>;
  brutal: Partial<{ [key: string]: number }>;
  beyondBrutal: Partial<{ [key: string]: number }>;
}>;

export const getTechniquesDisplay = (
  techniques: Techniques | undefined,
  t: Translate
) => {
  if (!techniques) return [];

  const techniqueNames: { [key: string]: string } = {
    lastDigit: t('techniques.lastDigit'),
    hiddenSingleBox: t('techniques.hiddenSingleBox'),
    hiddenSingleLine: t('techniques.hiddenSingleLine'),
    hiddenSingleVariantRegion: t('techniques.hiddenSingleVariantRegion'),
    nakedSingle: t('techniques.nakedSingle'),
    hiddenPair: t('techniques.hiddenPair'),
    lockedCandidate: t('techniques.lockedCandidate'),
    hiddenTriple: t('techniques.hiddenTriple'),
    hiddenQuadruple: t('techniques.hiddenQuadruple'),
    nakedPair: t('techniques.nakedPair'),
    nakedTriple: t('techniques.nakedTriple'),
    nakedQuadruple: t('techniques.nakedQuadruple'),
    xWing: t('techniques.xWing'),
    swordfish: t('techniques.swordfish'),
    skyscraper: t('techniques.skyscraper'),
    twoStringKite: t('techniques.twoStringKite'),
    crane: t('techniques.crane'),
    simpleColoring: t('techniques.simpleColoring'),
    yWing: t('techniques.yWing'),
    xYZWing: t('techniques.xYZWing'),
    wWing: t('techniques.wWing'),
    finnedSashimiXWing: t('techniques.finnedSashimiXWing'),
    emptyRectangle: t('techniques.emptyRectangle'),
    uniqueRectangleType1: t('techniques.uniqueRectangleType1'),
    uniqueRectangleType2: t('techniques.uniqueRectangleType2'),
    uniqueRectangleType3: t('techniques.uniqueRectangleType3'),
    uniqueRectangleType4: t('techniques.uniqueRectangleType4'),
    uniqueRectangleType5: t('techniques.uniqueRectangleType5'),
    finnedSashimiSwordfish: t('techniques.finnedSashimiSwordfish'),
    jellyfish: t('techniques.jellyfish'),
    bugBinaryUniversalGrave: t('techniques.bugBinaryUniversalGrave'),
    xChain: t('techniques.xChain'),
    groupedXChain: t('techniques.groupedXChain'),
    YWing4WXYZWing: t('techniques.YWing4WXYZWing'),
    yWing5: t('techniques.yWing5'),
    yWing6: t('techniques.yWing6'),
    yWing7: t('techniques.yWing7'),
    yWing8: t('techniques.yWing8'),
    yWing9: t('techniques.yWing9'),
    finnedSashimiJellyfish: t('techniques.finnedSashimiJellyfish'),
    medusa3D: t('techniques.medusa3D'),
    xyChain: t('techniques.xyChain'),
    alternatingInferenceChainAIC: t('techniques.alternatingInferenceChainAIC'),
    groupedAlternatingInferenceChainAIC: t(
      'techniques.groupedAlternatingInferenceChainAIC'
    ),
    nishioForcingChain: t('techniques.nishioForcingChain'),
    nishioForcingNet: t('techniques.nishioForcingNet'),
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

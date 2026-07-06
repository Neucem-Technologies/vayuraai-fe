import { MOCK_FACTORS, type EmissionFactor } from '@/lib/mock-data';

type LineForFactor = {
  description: string;
  category: string;
  unit: string;
};

function scoreFactor(factor: EmissionFactor, line: LineForFactor): number {
  let score = 0;
  const desc = line.description.toLowerCase();
  const name = factor.name.toLowerCase();
  const cat = factor.category.toLowerCase();
  const lineCat = line.category.toLowerCase();

  if (lineCat === cat) score += 5;
  if (name.includes('diesel') && /diesel|generator/i.test(desc)) score += 8;
  if (name.includes('petrol') && /petrol|gasoline|company car/i.test(desc)) score += 8;
  if (name.includes('grid electricity') && /electricity|grid|kwh/i.test(desc)) score += 8;
  if (name.includes('r-410') && /r-410|r410/i.test(desc)) score += 10;
  if (name.includes('r-134') && /r-134|r134/i.test(desc)) score += 10;
  if (name.includes('international') && /international|long haul/i.test(desc)) score += 6;
  if (name.includes('domestic air') && /flight|air/i.test(desc)) score += 6;
  if (name.includes('rail') && /train|irctc|rail/i.test(desc)) score += 8;
  if (name.includes('taxi') && /cab|uber|car/i.test(desc)) score += 6;
  if (name.includes('hotel') && /hotel|stay/i.test(desc)) score += 8;
  if (name.includes('landfill') && /waste|manifest/i.test(desc)) score += 6;
  if (name.includes('steel') && /steel/i.test(desc)) score += 8;
  if (name.includes('truck') && /freight|logistics/i.test(desc)) score += 6;
  if (name.includes('maintenance') && /hvac|maintenance|service contract|repair/i.test(desc)) score += 10;
  if (name.includes('freight & logistics') && /freight|logistics|courier|shipping/i.test(desc)) score += 10;
  if (name.includes('software') && /cursor|saas|software|subscription/i.test(desc)) score += 8;

  const factorUnit = factor.unit.split('/')[1]?.toLowerCase() ?? '';
  const lineUnit = line.unit.toLowerCase();
  if (factorUnit && lineUnit && factorUnit.startsWith(lineUnit.replace('l', 'l'))) score += 3;
  if (factorUnit === 'kwh' && lineUnit === 'kwh') score += 4;
  if (factorUnit === 'km' && lineUnit === 'km') score += 4;
  if (factorUnit === 'kg' && lineUnit === 'kg') score += 4;
  if (factorUnit === 'tonne' && lineUnit === 'tonne') score += 4;
  if (factorUnit === 'm3' && lineUnit === 'm3') score += 4;
  if (factorUnit === 'night' && lineUnit === 'night') score += 4;
  if (factorUnit === 'trip' && lineUnit === 'trip') score += 2;
  if (factorUnit === 'inr' && lineUnit === 'inr') score += 6;

  return score;
}

export function suggestFactorId(line: LineForFactor): string {
  let best = MOCK_FACTORS[0];
  let bestScore = -1;
  for (const factor of MOCK_FACTORS) {
    const score = scoreFactor(factor, line);
    if (score > bestScore) {
      bestScore = score;
      best = factor;
    }
  }
  return best.id;
}

/** Sort factors with best matches first for review dropdowns. */
export function sortFactorsForLine(
  factors: EmissionFactor[],
  line: LineForFactor,
): EmissionFactor[] {
  return [...factors].sort((a, b) => {
    const scoreDiff = scoreFactor(b, line) - scoreFactor(a, line);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
}

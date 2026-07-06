/** Format kg CO2e for display — use kg when under 1 tonne so small ledgers are readable. */
export function formatEmissionMass(kg: number): { amount: string; unit: 'kgCO2e' | 'tCO2e' } {
  const abs = Math.abs(kg);
  if (abs > 0 && abs < 1000) {
    return {
      amount: kg.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      unit: 'kgCO2e',
    };
  }
  return {
    amount: (kg / 1000).toLocaleString('en-IN', {
      maximumFractionDigits: abs >= 10_000 ? 1 : 2,
    }),
    unit: 'tCO2e',
  };
}

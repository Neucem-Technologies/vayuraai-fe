/** Billing units that represent a period/package — use INR spend amount instead. */
const SPEND_BILLING_UNITS = new Set([
  'contract',
  'month',
  'service',
  'period',
  'job',
  'order',
  'lot',
]);

export function parseFactorActivityUnit(factorUnit: string): string {
  const slash = factorUnit.lastIndexOf('/');
  if (slash < 0) return factorUnit.trim();
  return factorUnit.slice(slash + 1).trim();
}

export function computeLineKgCo2e(input: {
  quantity: number;
  unit: string;
  originalUnit?: string;
  spendAmount?: number | null;
  factorValue: number;
  factorUnit: string;
}): number {
  if (input.factorValue <= 0) return 0;

  const factorActivityUnit = parseFactorActivityUnit(input.factorUnit);
  let quantity = input.quantity;
  let unit = input.unit.trim();
  const originalUnit = (input.originalUnit ?? unit).trim();

  if (
    input.spendAmount != null &&
    input.spendAmount > 0 &&
    SPEND_BILLING_UNITS.has(unit.toLowerCase()) &&
    unit.toLowerCase() === originalUnit.toLowerCase()
  ) {
    quantity = input.spendAmount;
    unit = 'INR';
  }

  if (
    factorActivityUnit.toUpperCase() === 'INR' &&
    unit.toUpperCase() !== 'INR' &&
    SPEND_BILLING_UNITS.has(unit.toLowerCase()) &&
    input.spendAmount != null &&
    input.spendAmount > 0
  ) {
    quantity = input.spendAmount;
    unit = 'INR';
  }

  if (quantity <= 0) return 0;

  const unitsMatch =
    unit.toLowerCase() === factorActivityUnit.toLowerCase() ||
    (factorActivityUnit.toUpperCase() === 'INR' && unit.toUpperCase() === 'INR');

  if (!unitsMatch) return 0;

  return Math.round(quantity * input.factorValue * 100) / 100;
}

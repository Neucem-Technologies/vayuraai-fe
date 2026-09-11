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

/**
 * Map vendor/mode labels (Flight, Hotel, Car…) to factor activity units (trip, night, km…).
 * Keep in sync with backend activity-quantity.util / unit-converter.
 */
export function normalizeActivityUnit(raw: string): string {
  const original = raw.trim() || 'unit';
  const lower = original.toLowerCase();

  if (lower === 'litre' || lower === 'liter' || lower === 'l') return 'L';
  if (lower === 'kwh') return 'kWh';
  if (lower === 'km' || lower === 'kilometre' || lower === 'kilometer') return 'km';
  if (lower === 'tonne' || lower === 'ton') return 'tonne';
  if (lower === 'm3' || lower === 'cubic metre' || lower === 'cubic meter') return 'm3';
  if (lower === 'kg' || lower === 'kilogram') return 'kg';
  if (lower === 'flight' || lower === 'train' || lower === 'trip') return 'trip';
  if (lower === 'hotel' || lower === 'night' || lower === 'nights') return 'night';
  if (lower === 'car' || lower === 'cab' || lower === 'taxi') return 'km';
  if (lower === 'meal' || lower === 'meals') return 'meal';
  if (lower === 'usd' || lower === 'us$' || lower === '$') return 'USD';
  if (lower === 'inr' || lower === '₹' || lower === 'rs') return 'INR';
  if (lower === 'subscription') return 'subscription';

  return original;
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
  let unit = normalizeActivityUnit(input.unit);
  const originalUnit = normalizeActivityUnit(input.originalUnit ?? input.unit);

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

/** Matches backend default for SaaS / shared services. */
export const ORGANISATION_WIDE_FACILITY = 'Organisation-wide';

export function displayFacility(facility: string | undefined | null, category?: string): string {
  const trimmed = facility?.trim();
  if (trimmed) return trimmed;
  if (category === 'Purchased Services') return ORGANISATION_WIDE_FACILITY;
  return '—';
}

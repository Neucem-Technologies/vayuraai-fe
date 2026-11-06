/**
 * Shared inventory boundary matching for report rollups (API) and UI previews (SPA).
 * Keep FE/BE behaviour identical so "matching lines" counts match generated PDFs.
 */
export function facilityMatchesBoundary(
  facility: string | null | undefined,
  boundaryLabel: string | null | undefined,
): boolean {
  if (!boundaryLabel || boundaryLabel === 'all') return true;
  const value = facility?.trim().toLowerCase() ?? '';
  if (!value) return false;

  const target = boundaryLabel.trim().toLowerCase();
  if (target === 'india') {
    return (
      value === 'india' ||
      value.endsWith(', india') ||
      /\b(india|indian)\b/.test(value)
    );
  }
  if (target === 'manufacturing') {
    return /\b(manufactur|plant|factory)\b/.test(value);
  }
  if (target === 'organisation-wide') {
    return value === 'organisation-wide' || value === 'organization-wide';
  }
  // Exact name match only (avoids "india" matching "indiana").
  return value === target;
}

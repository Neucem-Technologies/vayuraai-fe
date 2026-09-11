/** Indian financial year helpers (1 Apr → 31 Mar). */

export function indianFyBoundsContaining(isoDate: string): { start: string; end: string } | null {
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  // Apr–Mar: Jan–Mar belong to FY that started previous calendar year
  const fyStartYear = m >= 4 ? y : y - 1;
  return {
    start: `${fyStartYear}-04-01`,
    end: `${fyStartYear + 1}-03-31`,
  };
}

/** Prefer FY covering the latest activity date; else previous completed Indian FY. */
export function defaultReportingPeriod(activityDates: string[]): { start: string; end: string } {
  const sorted = [...activityDates]
    .map((d) => d.trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d))
    .sort();
  if (sorted.length > 0) {
    const latest = sorted[sorted.length - 1];
    const bounds = indianFyBoundsContaining(latest);
    if (bounds) return bounds;
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  // Previous completed FY relative to today
  const currentFyStart = m >= 4 ? y : y - 1;
  const prevFyStart = currentFyStart - 1;
  return {
    start: `${prevFyStart}-04-01`,
    end: `${prevFyStart + 1}-03-31`,
  };
}

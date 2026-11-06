/** Indian financial year helpers (1 Apr → 31 Mar). */

import {
  defaultIndiaFyStartYear,
  fyFromStartYear,
  listRecentFys,
  readStoredReportingFy,
  writeStoredReportingFy,
  type ReportingFy,
} from '@/lib/reporting-fy';

export type { ReportingFy };
export {
  defaultIndiaFyStartYear,
  fyFromStartYear,
  listRecentFys,
  readStoredReportingFy,
  writeStoredReportingFy,
};

export function indianFyBoundsContaining(isoDate: string): { start: string; end: string } | null {
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  const fyStartYear = m >= 4 ? y : y - 1;
  const fy = fyFromStartYear(fyStartYear);
  return { start: fy.periodStart, end: fy.periodEnd };
}

/** Prefer FY covering the latest activity date; else previous completed Indian FY. */
export function defaultReportingPeriod(activityDates: string[]): { start: string; end: string } {
  const sorted = [...activityDates]
    .map((d) => d.trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d))
    .sort();
  if (sorted.length > 0) {
    const latest = sorted[sorted.length - 1]!;
    const bounds = indianFyBoundsContaining(latest);
    if (bounds) return bounds;
  }

  const current = defaultIndiaFyStartYear();
  const prev = fyFromStartYear(current - 1);
  return { start: prev.periodStart, end: prev.periodEnd };
}

/** Indian FY chrome (header selector + localStorage). Bounds helpers live in reporting-period.ts. */

const STORAGE_KEY = 'vayura.reportingFyStartYear';

/** Indian financial year starting April `startYear` (e.g. 2025 → FY 2025-26). */
export type ReportingFy = {
  startYear: number;
  label: string;
  periodStart: string;
  periodEnd: string;
};

export function fyFromStartYear(startYear: number): ReportingFy {
  return {
    startYear,
    label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
    periodStart: `${startYear}-04-01`,
    periodEnd: `${startYear + 1}-03-31`,
  };
}

export function defaultIndiaFyStartYear(now = new Date()): number {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function listRecentFys(count = 5, now = new Date()): ReportingFy[] {
  const current = defaultIndiaFyStartYear(now);
  return Array.from({ length: count }, (_, i) => fyFromStartYear(current - i));
}

export function readStoredReportingFy(): ReportingFy {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) {
    return fyFromStartYear(parsed);
  }
  return fyFromStartYear(defaultIndiaFyStartYear());
}

export function writeStoredReportingFy(startYear: number): void {
  localStorage.setItem(STORAGE_KEY, String(startYear));
}

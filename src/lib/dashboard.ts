import type { EmissionRecord, UploadDoc } from '@/lib/mock-data';

export type DashboardInsight = {
  id: string;
  severity: 'warning' | 'info' | 'success';
  title: string;
  detail: string;
  timeAgo: string;
};

export type DashboardActivity = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timeAgo: string;
};

export type DashboardStats = {
  documentsUploaded: number;
  pendingReviews: number;
  processing: number;
  completed: number;
  failed: number;
  reportsGenerated: number;
  /** Tonnes CO2e from approved activity records. */
  totalEmissions: number;
  /** Display unit for the KPI (kg when small). */
  emissionsUnit: 'kgCO2e' | 'tCO2e';
  /** Raw kg for charts that prefer formatting themselves. */
  totalEmissionsKg: number;
  scopeBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; current: number; previous: number }[];
  topSources: { name: string; value: number }[];
  insights: DashboardInsight[];
  activity: DashboardActivity[];
};

export function emptyDashboardStats(): DashboardStats {
  return {
    documentsUploaded: 0,
    pendingReviews: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    reportsGenerated: 0,
    totalEmissions: 0,
    emissionsUnit: 'tCO2e',
    totalEmissionsKg: 0,
    scopeBreakdown: [],
    monthlyTrend: [],
    topSources: [],
    insights: [],
    activity: [],
  };
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function uploadAction(status: UploadDoc['status']): string {
  switch (status) {
    case 'Processing':
      return 'is processing';
    case 'Needs Review':
      return 'needs review:';
    case 'Completed':
      return 'completed ingestion for';
    case 'Failed':
      return 'failed to process';
  }
}

function kgToDisplayTonnes(kg: number): { value: number; unit: 'kgCO2e' | 'tCO2e' } {
  const abs = Math.abs(kg);
  if (abs > 0 && abs < 1000) {
    return { value: Math.round(kg * 10) / 10, unit: 'kgCO2e' };
  }
  return { value: Math.round((kg / 1000) * 100) / 100, unit: 'tCO2e' };
}

function kgToTonnes(kg: number): number {
  return Math.round((kg / 1000) * 100) / 100;
}

function parseActivityDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildMonthlyTrend(emissions: EmissionRecord[]): DashboardStats['monthlyTrend'] {
  if (emissions.length === 0) return [];

  const dated = emissions
    .map((e) => ({ e, date: parseActivityDate(e.date) }))
    .filter((x): x is { e: EmissionRecord; date: Date } => x.date !== null);

  if (dated.length === 0) return [];

  const latest = dated.reduce((max, x) => (x.date > max ? x.date : max), dated[0].date);
  const year = latest.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const currentByMonth = new Array(12).fill(0);
  const previousByMonth = new Array(12).fill(0);

  for (const { e, date } of dated) {
    const y = date.getFullYear();
    const m = date.getMonth();
    if (y === year) currentByMonth[m] += e.kgCO2e;
    if (y === year - 1) previousByMonth[m] += e.kgCO2e;
  }

  return months.map((month, i) => ({
    month,
    current: kgToTonnes(currentByMonth[i]),
    previous: kgToTonnes(previousByMonth[i]),
  }));
}

function buildScopeBreakdown(emissions: EmissionRecord[]): DashboardStats['scopeBreakdown'] {
  const scopes = ['Scope 1', 'Scope 2', 'Scope 3'] as const;
  return scopes
    .map((name) => ({
      name,
      value: kgToTonnes(
        emissions.filter((e) => e.scope === name).reduce((sum, e) => sum + e.kgCO2e, 0),
      ),
    }))
    .filter((s) => s.value > 0);
}

function buildTopSources(emissions: EmissionRecord[]): DashboardStats['topSources'] {
  const byCategory = new Map<string, number>();
  for (const e of emissions) {
    const key = e.category?.trim() || e.activity?.trim() || 'Other';
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.kgCO2e);
  }
  return [...byCategory.entries()]
    .map(([name, kg]) => ({ name, value: kgToTonnes(kg) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function computeDashboardStats(
  uploads: UploadDoc[],
  emissions: EmissionRecord[] = [],
  reportsGenerated = 0,
): DashboardStats {
  const approved = emissions.filter((e) => e.status === 'Approved');
  const totalKg = approved.reduce((sum, e) => sum + e.kgCO2e, 0);
  const display = kgToDisplayTonnes(totalKg);

  if (uploads.length === 0 && approved.length === 0) {
    return {
      ...emptyDashboardStats(),
      reportsGenerated,
      insights: [
        {
          id: 'no-uploads',
          severity: 'info',
          title: 'No documents uploaded yet',
          detail:
            'Upload electricity bills, fuel invoices, or spreadsheets to start building this client’s emissions inventory.',
          timeAgo: 'Now',
        },
      ],
    };
  }

  const pendingReviews = uploads.filter((u) => u.status === 'Needs Review').length;
  const processing = uploads.filter((u) => u.status === 'Processing').length;
  const completed = uploads.filter((u) => u.status === 'Completed').length;
  const failed = uploads.filter((u) => u.status === 'Failed').length;

  const insights: DashboardInsight[] = [];
  if (pendingReviews > 0) {
    insights.push({
      id: 'pending-review',
      severity: 'warning',
      title: `${pendingReviews} document${pendingReviews === 1 ? '' : 's'} need review`,
      detail: 'Open Uploads to review extracted line items before they feed into emissions calculations.',
      timeAgo: 'Now',
    });
  }
  if (processing > 0) {
    insights.push({
      id: 'processing',
      severity: 'info',
      title: `${processing} document${processing === 1 ? '' : 's'} processing`,
      detail: 'Extraction and normalization are running in the background.',
      timeAgo: 'Now',
    });
  }
  if (failed > 0) {
    insights.push({
      id: 'failed',
      severity: 'warning',
      title: `${failed} upload${failed === 1 ? '' : 's'} failed`,
      detail: 'Check Uploads for error details and retry with a supported file format.',
      timeAgo: 'Now',
    });
  }
  if (approved.length > 0) {
    insights.push({
      id: 'emissions-ready',
      severity: 'success',
      title: `${approved.length} approved activit${approved.length === 1 ? 'y' : 'ies'} in the ledger`,
      detail: 'Dashboard charts reflect posted emissions from reviewed documents.',
      timeAgo: 'Now',
    });
  } else if (completed > 0 && pendingReviews === 0 && processing === 0 && failed === 0) {
    insights.push({
      id: 'all-clear',
      severity: 'success',
      title: 'All uploads processed',
      detail: 'Approve reviewed line items to post them to the emissions ledger and populate charts.',
      timeAgo: 'Now',
    });
  }

  const activity = [...uploads]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      actor: u.uploadedBy,
      action: uploadAction(u.status),
      target: u.filename,
      timeAgo: formatRelativeTime(u.date),
    }));

  return {
    documentsUploaded: uploads.length,
    pendingReviews,
    processing,
    completed,
    failed,
    reportsGenerated,
    totalEmissions: display.value,
    emissionsUnit: display.unit,
    totalEmissionsKg: totalKg,
    scopeBreakdown: buildScopeBreakdown(approved),
    monthlyTrend: buildMonthlyTrend(approved),
    topSources: buildTopSources(approved),
    insights,
    activity,
  };
}

export function formatEmissions(value: number): string {
  if (value === 0) return '—';
  return value.toLocaleString('en-IN');
}

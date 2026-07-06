import type { UploadDoc } from '@/lib/mock-data';

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
  totalEmissions: number;
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

export function computeDashboardStats(uploads: UploadDoc[]): DashboardStats {
  if (uploads.length === 0) {
    return {
      ...emptyDashboardStats(),
      insights: [
        {
          id: 'no-uploads',
          severity: 'info',
          title: 'No documents uploaded yet',
          detail: 'Upload electricity bills, fuel invoices, or spreadsheets to start building this client’s emissions inventory.',
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
  if (completed > 0 && pendingReviews === 0 && processing === 0 && failed === 0) {
    insights.push({
      id: 'all-clear',
      severity: 'success',
      title: 'All uploads processed',
      detail: 'Emissions charts will populate once activity data is calculated from ingested documents.',
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
    reportsGenerated: 0,
    totalEmissions: 0,
    scopeBreakdown: [],
    monthlyTrend: [],
    topSources: [],
    insights,
    activity,
  };
}

export function formatEmissions(value: number): string {
  if (value === 0) return '—';
  return value.toLocaleString('en-IN');
}

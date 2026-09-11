import { apiFetch } from '@/lib/api-client';
import { TOKEN_KEY } from '@/hooks/use-auth';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportDto,
  ReportsListResponse,
} from '@vayura/api-contracts/reports';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function listReports(orgId: string): Promise<ReportDto[]> {
  const data = await apiFetch<ReportsListResponse>(`/api/v1/organisations/${orgId}/reports`, {
    accessToken: token(),
  });
  return data.reports;
}

export async function createReport(orgId: string, body: CreateReportRequest): Promise<ReportDto> {
  const data = await apiFetch<CreateReportResponse>(`/api/v1/organisations/${orgId}/reports`, {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify(body),
  });
  return data.report;
}

export async function submitReport(orgId: string, reportId: string): Promise<ReportDto> {
  const data = await apiFetch<{ report: ReportDto }>(
    `/api/v1/organisations/${orgId}/reports/${reportId}/submit`,
    { method: 'POST', accessToken: token() },
  );
  return data.report;
}

export async function fetchReportPdfBlob(
  orgId: string,
  reportId: string,
): Promise<{ blob: Blob; objectUrl: string }> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not set.');
  const accessToken = token();
  const res = await fetch(`${baseUrl}/api/v1/organisations/${orgId}/reports/${reportId}/download`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load report PDF.');
  const blob = await res.blob();
  return { blob, objectUrl: URL.createObjectURL(blob) };
}

export async function downloadReportPdf(orgId: string, reportId: string, filename: string): Promise<void> {
  const { objectUrl } = await fetchReportPdfBlob(orgId, reportId);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadClientReportPdf(reportId: string, filename: string): Promise<void> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not set.');
  const accessToken = token();
  const res = await fetch(`${baseUrl}/api/v1/client/reports/${reportId}/download`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to download report.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type { ReportDto, CreateReportRequest };

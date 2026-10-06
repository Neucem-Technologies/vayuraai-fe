import { apiFetch } from '@/lib/api-client';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportDownloadResponse,
  ReportDto,
  ReportsListResponse,
} from '@vayura/api-contracts/reports';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function listReports(orgId: string): Promise<ReportDto[]> {
  const data = await apiFetch<ReportsListResponse>(`/api/v1/organisations/${orgId}/reports`, {
  });
  return data.reports;
}

export async function createReport(orgId: string, body: CreateReportRequest): Promise<ReportDto> {
  const data = await apiFetch<CreateReportResponse>(`/api/v1/organisations/${orgId}/reports`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.report;
}

export async function submitReport(orgId: string, reportId: string): Promise<ReportDto> {
  const data = await apiFetch<{ report: ReportDto }>(
    `/api/v1/organisations/${orgId}/reports/${reportId}/submit`,
    { method: 'POST' },
  );
  return data.report;
}

async function fetchSignedPdf(downloadPath: string): Promise<{ blob: Blob; objectUrl: string }> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not set.');
  const res = await fetch(`${baseUrl}${downloadPath}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('This download link is invalid or has expired.');
  const blob = await res.blob();
  return { blob, objectUrl: URL.createObjectURL(blob) };
}

export async function fetchReportPdfBlob(
  orgId: string,
  reportId: string,
): Promise<{ blob: Blob; objectUrl: string }> {
  const signed = await apiFetch<ReportDownloadResponse>(
    `/api/v1/organisations/${orgId}/reports/${reportId}/download`,
    {},
  );
  return fetchSignedPdf(signed.url);
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
  const signed = await apiFetch<ReportDownloadResponse>(`/api/v1/client/reports/${reportId}/download`, {
  });
  const { objectUrl } = await fetchSignedPdf(signed.url);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export type { ReportDto, CreateReportRequest };

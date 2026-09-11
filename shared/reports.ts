export type ReportFramework = 'BRSR' | 'GRI' | 'GHG';

export type ReportStatus = 'generating' | 'final' | 'submitted' | 'failed';

export type ReportDto = {
  id: string;
  organisationId: string;
  name: string;
  framework: ReportFramework;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  boundaryLabel: string;
  status: ReportStatus;
  totalKgCO2e: number;
  totalTonnesCO2e: number;
  generatedBy: string;
  generatedAt: string | null;
  submittedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type ReportsListResponse = { reports: ReportDto[] };

export type CreateReportRequest = {
  framework: ReportFramework;
  periodStart: string;
  periodEnd: string;
  boundaryLabel?: string;
  name?: string;
};

export type CreateReportResponse = { report: ReportDto };

export type ReportDownloadResponse = {
  contentType: string;
  filename: string;
};

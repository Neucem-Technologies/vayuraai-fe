export type ClientDashboard = {
  organisation: { id: string; legalName: string; shortName: string };
  emissions: { scope1Kg: number; scope2Kg: number; scope3Kg: number; period: string };
  showConsultantBranding: boolean;
};

export type ClientReportRow = {
  id: string;
  name: string;
  period: string;
  status: string;
  generatedAt: string | null;
};

export type ClientReportsResponse = { reports: ClientReportRow[] };

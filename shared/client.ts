export type ClientDashboardPeriod = 'fy' | 'q1' | 'q2' | 'q3' | 'q4';

export type ClientDashboard = {
  organisation: { id: string; legalName: string; shortName: string };
  emissions: { scope1Kg: number; scope2Kg: number; scope3Kg: number; period: string };
  intensity: {
    kgPerEmployee: number | null;
    kgPerCroreInr: number | null;
    employeeCount: number | null;
    annualTurnoverInr: number | null;
  };
  period: ClientDashboardPeriod;
  fyStartYear: number;
  fyStartYears: number[];
  showConsultantBranding: boolean;
  consultantFirmName: string | null;
};

export type ClientReportRow = {
  id: string;
  name: string;
  period: string;
  status: string;
  generatedAt: string | null;
};

export type ClientReportsResponse = { reports: ClientReportRow[] };

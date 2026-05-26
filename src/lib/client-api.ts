import { apiFetch } from '@/lib/api-client';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export type ClientDashboard = {
  organisation: { id: string; legalName: string; shortName: string };
  emissions: { scope1Kg: number; scope2Kg: number; scope3Kg: number; period: string };
  showConsultantBranding: boolean;
};

export async function fetchClientDashboard(): Promise<ClientDashboard> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  return apiFetch<ClientDashboard>('/api/v1/client/dashboard', {
    method: 'GET',
    accessToken,
  });
}

export type ClientReportRow = {
  id: string;
  name: string;
  period: string;
  status: string;
  generatedAt: string | null;
};

export async function fetchClientReports(): Promise<ClientReportRow[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<{ reports: ClientReportRow[] }>('/api/v1/client/reports', {
    method: 'GET',
    accessToken,
  });
  return data.reports;
}

export async function acceptClientInvite(
  inviteToken: string,
  password: string,
): Promise<{ accessToken: string; tokenType: 'Bearer'; orgId: string }> {
  return apiFetch<{ accessToken: string; tokenType: 'Bearer'; orgId: string }>(
    '/api/v1/auth/accept-client-invite',
    {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken, password }),
    },
  );
}

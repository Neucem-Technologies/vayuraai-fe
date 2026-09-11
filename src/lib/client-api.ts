import { apiFetch } from '@/lib/api-client';
import type { AcceptClientInviteResponse } from '@vayura/api-contracts/auth';
import type { ClientDashboard, ClientReportsResponse } from '@vayura/api-contracts/client';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export type { ClientDashboard };
export type ClientReportRow = ClientReportsResponse['reports'][number];

export async function fetchClientDashboard(): Promise<ClientDashboard> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  return apiFetch<ClientDashboard>('/api/v1/client/dashboard', {
    method: 'GET',
    accessToken,
  });
}

export async function fetchClientReports(): Promise<ClientReportRow[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<ClientReportsResponse>('/api/v1/client/reports', {
    method: 'GET',
    accessToken,
  });
  return data.reports;
}

export async function acceptClientInvite(
  inviteToken: string,
  password: string,
): Promise<AcceptClientInviteResponse> {
  return apiFetch<AcceptClientInviteResponse>('/api/v1/auth/accept-client-invite', {
    method: 'POST',
    body: JSON.stringify({ token: inviteToken, password }),
  });
}

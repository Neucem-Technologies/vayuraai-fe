import { apiFetch } from '@/lib/api-client';
import type { AcceptClientInviteResponse } from '@vayura/api-contracts/auth';
import type { ClientDashboard, ClientDashboardPeriod, ClientReportsResponse } from '@vayura/api-contracts/client';

export type { ClientDashboard };
export type ClientReportRow = ClientReportsResponse['reports'][number];

export async function fetchClientDashboard(query?: {
  period?: ClientDashboardPeriod;
  year?: number;
}): Promise<ClientDashboard> {
  const params = new URLSearchParams();
  if (query?.period) params.set('period', query.period);
  if (query?.year) params.set('year', String(query.year));
  const qs = params.toString();
  return apiFetch<ClientDashboard>(`/api/v1/client/dashboard${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function fetchClientReports(): Promise<ClientReportRow[]> {
  const data = await apiFetch<ClientReportsResponse>('/api/v1/client/reports', {
    method: 'GET',
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

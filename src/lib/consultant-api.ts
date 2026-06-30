import { apiFetch } from '@/lib/api-client';
import type {
  ClientViewerSummary,
  ClientViewersListResponse,
  InviteClientViewerResponse,
  RevokeClientViewerResponse,
} from '@vayura/api-contracts/consultant';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export type { ClientViewerSummary };

export async function listClientViewers(orgId: string): Promise<ClientViewerSummary[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<ClientViewersListResponse>(
    `/api/v1/consultant/orgs/${orgId}/client-viewers`,
    { method: 'GET', accessToken },
  );
  return data.viewers;
}

export async function inviteClientViewer(
  orgId: string,
  email: string,
  fullName: string,
): Promise<InviteClientViewerResponse> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  return apiFetch<InviteClientViewerResponse>(`/api/v1/consultant/orgs/${orgId}/invite-client`, {
    method: 'POST',
    body: JSON.stringify({ email, fullName }),
    accessToken,
  });
}

export async function revokeClientViewer(orgId: string, userId: string): Promise<void> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  await apiFetch<RevokeClientViewerResponse>(
    `/api/v1/consultant/orgs/${orgId}/client-access/${userId}`,
    { method: 'DELETE', accessToken },
  );
}

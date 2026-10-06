import { apiFetch } from '@/lib/api-client';
import type {
  ClientViewerSummary,
  ClientViewersListResponse,
  InviteClientViewerResponse,
  RevokeClientViewerResponse,
} from '@vayura/api-contracts/consultant';

export type { ClientViewerSummary };

export async function listClientViewers(orgId: string): Promise<ClientViewerSummary[]> {
  const data = await apiFetch<ClientViewersListResponse>(
    `/api/v1/consultant/orgs/${orgId}/client-viewers`,
    { method: 'GET' },
  );
  return data.viewers;
}

export async function inviteClientViewer(
  orgId: string,
  email: string,
  fullName: string,
): Promise<InviteClientViewerResponse> {
  return apiFetch<InviteClientViewerResponse>(`/api/v1/consultant/orgs/${orgId}/invite-client`, {
    method: 'POST',
    body: JSON.stringify({ email, fullName }),
  });
}

export async function revokeClientViewer(orgId: string, userId: string): Promise<void> {
  await apiFetch<RevokeClientViewerResponse>(
    `/api/v1/consultant/orgs/${orgId}/client-access/${userId}`,
    { method: 'DELETE' },
  );
}

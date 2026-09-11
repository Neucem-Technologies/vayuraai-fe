import { apiFetch } from '@/lib/api-client';
import { fetchMe } from '@/lib/auth-api';
import type {
  CreateOrganisationInput,
  OrganisationDto,
  OrganisationResponse,
  OrganisationsListResponse,
  UpdateOrganisationInput,
} from '@vayura/api-contracts/tenancy';
import type { MeProfile, AccessProfile } from '@vayura/api-contracts/auth';
import type { TenantPlan, TenantRole } from '@vayura/api-contracts/common';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

export type {
  OrganisationDto,
  MeProfile,
  AccessProfile,
  CreateOrganisationInput,
  UpdateOrganisationInput,
  TenantPlan,
  TenantRole,
};
export type OrganisationStatus = OrganisationDto['status'];

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function fetchMeProfile(): Promise<MeProfile> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  return fetchMe(accessToken);
}

export async function listOrganisations(): Promise<OrganisationDto[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<OrganisationsListResponse>('/api/v1/organisations', {
    method: 'GET',
    accessToken,
  });
  return data.organisations;
}

export async function createOrganisation(input: CreateOrganisationInput): Promise<OrganisationDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<OrganisationResponse>('/api/v1/organisations', {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
  return data.organisation;
}

export async function updateOrganisation(
  orgId: string,
  input: UpdateOrganisationInput,
): Promise<OrganisationDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<OrganisationResponse>(`/api/v1/organisations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    accessToken,
  });
  return data.organisation;
}

export async function getOrganisation(orgId: string): Promise<OrganisationDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<OrganisationResponse>(`/api/v1/organisations/${orgId}`, {
    method: 'GET',
    accessToken,
  });
  return data.organisation;
}

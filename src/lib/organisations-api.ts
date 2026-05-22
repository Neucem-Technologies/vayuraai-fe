import { apiFetch } from '@/lib/api-client';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

export type OrganisationStatus = 'active' | 'onboarding' | 'paused' | 'archived';

export type OrganisationDto = {
  id: string;
  legalName: string;
  shortName: string;
  industry: string | null;
  country: string;
  status: OrganisationStatus;
  clientViewerEnabled: boolean;
  showConsultantBranding: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantRole = 'consultant_admin' | 'consultant_member';

export type MeProfile = {
  user: {
    id: string;
    email: string;
    userType: 'consultant' | 'sme';
    fullName: string | null;
  };
  tenant: {
    id: string;
    name: string;
    plan: TenantPlan;
    role: TenantRole;
  } | null;
  organisations: OrganisationDto[];
  orgMemberships: Array<{
    orgId: string;
    role: string;
    organisation: OrganisationDto;
  }>;
};

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function fetchMeProfile(): Promise<MeProfile> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  return apiFetch<MeProfile>('/api/v1/auth/me', { method: 'GET', accessToken });
}

export async function listOrganisations(): Promise<OrganisationDto[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<{ organisations: OrganisationDto[] }>('/api/v1/organisations', {
    method: 'GET',
    accessToken,
  });
  return data.organisations;
}

export type CreateOrganisationInput = {
  legalName: string;
  shortName: string;
  industry?: string;
  country?: string;
};

export async function createOrganisation(
  input: CreateOrganisationInput,
): Promise<OrganisationDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<{ organisation: OrganisationDto }>('/api/v1/organisations', {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
  return data.organisation;
}

export async function getOrganisation(orgId: string): Promise<OrganisationDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<{ organisation: OrganisationDto }>(
    `/api/v1/organisations/${orgId}`,
    { method: 'GET', accessToken },
  );
  return data.organisation;
}

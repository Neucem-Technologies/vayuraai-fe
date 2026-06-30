import type { OrganisationStatus, OrgRole, TenantPlan, TenantRole } from './common.js';

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

export type TenantDto = {
  id: string;
  name: string;
  plan: TenantPlan;
  role: TenantRole;
};

export type OrgMembershipDto = {
  orgId: string;
  role: OrgRole;
  organisation: OrganisationDto;
};

export type OrganisationsListResponse = { organisations: OrganisationDto[] };
export type OrganisationResponse = { organisation: OrganisationDto };

export type CreateOrganisationInput = {
  legalName: string;
  shortName: string;
  industry?: string;
  country?: string;
};

export type UpdateOrganisationInput = {
  legalName?: string;
  shortName?: string;
  industry?: string | null;
  country?: string;
  status?: OrganisationStatus;
  clientViewerEnabled?: boolean;
  showConsultantBranding?: boolean;
};

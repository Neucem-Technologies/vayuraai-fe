import type {
  ConsolidationApproach,
  FacilityPurpose,
  OrganisationStatus,
  OrgRole,
  TenantPlan,
  TenantRole,
} from './common.js';

export type ReportLogoPlacement =
  | 'header_left'
  | 'header_right'
  | 'header_center'
  | 'footer_left'
  | 'footer_right'
  | 'footer_center';

/** BRSR Section A / GRI 2 / GHG intensity fields captured on the client org. */
export type OrganisationReportingProfile = {
  cin: string | null;
  lei: string | null;
  gstin: string | null;
  yearOfIncorporation: number | null;
  registeredOfficeAddress: string;
  website: string | null;
  email: string | null;
  telephone: string | null;
  stockExchanges: string | null;
  paidUpCapitalInr: number | null;
  employeeCount: number | null;
  workerCount: number | null;
  annualTurnoverInr: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type OrganisationReportingInput = {
  cin?: string | null;
  lei?: string | null;
  gstin?: string | null;
  yearOfIncorporation?: number | null;
  registeredOfficeAddress?: string | null;
  website?: string | null;
  email?: string | null;
  telephone?: string | null;
  stockExchanges?: string | null;
  paidUpCapitalInr?: number | null;
  employeeCount?: number | null;
  workerCount?: number | null;
  annualTurnoverInr?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export type OrganisationDto = {
  id: string;
  legalName: string;
  shortName: string;
  industry: string | null;
  country: string;
  status: OrganisationStatus;
  consolidationApproach: ConsolidationApproach;
  clientViewerEnabled: boolean;
  showConsultantBranding: boolean;
  createdAt: string;
  updatedAt: string;
} & OrganisationReportingProfile;

export type TenantDto = {
  id: string;
  name: string;
  plan: TenantPlan;
  role: TenantRole;
  whiteLabelEnabled: boolean;
  brandColorHex: string;
  reportFooterDisclaimer: string;
  reportLogoPlacement: ReportLogoPlacement;
  hasReportLogo: boolean;
};

export type UpdateTenantBrandingInput = {
  whiteLabelEnabled?: boolean;
  brandColorHex?: string;
  reportFooterDisclaimer?: string;
  reportLogoPlacement?: ReportLogoPlacement;
};

export type TenantBrandingResponse = { tenant: TenantDto };

export type TenantBrandingPreviewInput = {
  whiteLabelEnabled?: boolean;
  brandColorHex?: string;
  reportFooterDisclaimer?: string;
  reportLogoPlacement?: ReportLogoPlacement;
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
} & OrganisationReportingInput;

export type UpdateOrganisationInput = {
  legalName?: string;
  shortName?: string;
  industry?: string | null;
  country?: string;
  status?: OrganisationStatus;
  consolidationApproach?: ConsolidationApproach;
  clientViewerEnabled?: boolean;
  showConsultantBranding?: boolean;
} & OrganisationReportingInput;

export type FacilityDto = {
  id: string;
  name: string;
  type: string;
  purpose: FacilityPurpose;
  address: string;
  country: string;
  employees: number;
};

export type FacilitiesListResponse = { facilities: FacilityDto[] };
export type FacilityResponse = { facility: FacilityDto };

export type CreateFacilityInput = {
  name: string;
  type: string;
  purpose?: FacilityPurpose;
  address?: string;
  country?: string;
  employees?: number;
};

export type UpdateFacilityInput = {
  name?: string;
  type?: string;
  purpose?: FacilityPurpose;
  address?: string;
  country?: string;
  employees?: number;
};

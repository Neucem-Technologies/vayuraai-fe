export type ConsultantEnquireStatus = 'open' | 'closed';

export type ListedConsultantDto = {
  id: string;
  displayName: string;
  primaryService: string | null;
  country: string;
  website: string | null;
  listingBio: string;
  entityType: string | null;
  teamSize: string | null;
  hasLogo: boolean;
};

export type ListedConsultantsResponse = { consultants: ListedConsultantDto[] };

export type UpdateTenantListingInput = {
  listed?: boolean;
  listingBio?: string;
};

export type CreateConsultantEnquireInput = {
  message: string;
  organisationId?: string;
  contactEmail?: string;
  contactName?: string;
};

export type ConsultantEnquireDto = {
  id: string;
  targetTenantId: string;
  organisationId: string | null;
  message: string;
  contactEmail: string;
  contactName: string;
  status: ConsultantEnquireStatus;
  createdAt: string;
};

export type ConsultantEnquireResponse = { enquire: ConsultantEnquireDto };

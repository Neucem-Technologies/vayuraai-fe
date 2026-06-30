import type { OrganisationDto } from '@/lib/organisations-api';

export type ClientOrgStatus = 'Active' | 'Onboarding' | 'Paused';

/** Portfolio card / active client — mapped from OrganisationDto only. */
export type ClientOrg = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  industry: string | null;
  country: string;
  status: ClientOrgStatus;
  clientViewerEnabled: boolean;
  showConsultantBranding: boolean;
  engagementSince: string;
};

export type PortfolioStats = {
  totalClients: number;
  activeEngagements: number;
  industriesCovered: number;
  reportsInProgress: number;
  pendingReviews: number;
  totalEmissions: number;
};

export function emptyPortfolioStats(): PortfolioStats {
  return {
    totalClients: 0,
    activeEngagements: 0,
    industriesCovered: 0,
    reportsInProgress: 0,
    pendingReviews: 0,
    totalEmissions: 0,
  };
}

export function computePortfolioStats(clients: ClientOrg[]): PortfolioStats {
  if (clients.length === 0) return emptyPortfolioStats();
  const industries = new Set(clients.map((c) => c.industry).filter(Boolean));
  return {
    totalClients: clients.length,
    activeEngagements: clients.filter((c) => c.status === 'Active').length,
    industriesCovered: industries.size,
    reportsInProgress: clients.filter((c) => c.status === 'Onboarding').length,
    pendingReviews: 0,
    totalEmissions: 0,
  };
}

const STATUS_LABEL: Record<OrganisationDto['status'], ClientOrgStatus> = {
  active: 'Active',
  onboarding: 'Onboarding',
  paused: 'Paused',
  archived: 'Paused',
};

function initialsFrom(shortName: string): string {
  const parts = shortName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return shortName.slice(0, 2).toUpperCase();
}

export function organisationToClientOrg(org: OrganisationDto): ClientOrg {
  return {
    id: org.id,
    name: org.legalName,
    shortName: org.shortName,
    initials: initialsFrom(org.shortName),
    industry: org.industry,
    country: org.country,
    status: STATUS_LABEL[org.status],
    clientViewerEnabled: org.clientViewerEnabled,
    showConsultantBranding: org.showConsultantBranding,
    engagementSince: new Date(org.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    }),
  };
}

export function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

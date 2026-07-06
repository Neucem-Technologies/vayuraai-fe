import type { ClientOrg } from '@/lib/mock-data';
import type { OrganisationDto } from '@/lib/organisations-api';

const STATUS_LABEL: Record<OrganisationDto['status'], ClientOrg['status']> = {
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

/** Map API organisation to portfolio card shape; metrics stay placeholder until Phase 4. */
export function organisationToClientOrg(org: OrganisationDto): ClientOrg {
  return {
    id: org.id,
    name: org.legalName,
    shortName: org.shortName,
    initials: initialsFrom(org.shortName),
    industry: org.industry ?? 'Other',
    country: org.country,
    fiscalYearStart: 'April',
    reportingStandard: 'BRSR',
    status: STATUS_LABEL[org.status],
    reportingStatus: org.status === 'onboarding' ? 'Setup' : 'In Progress',
    primaryContact: { name: '—', role: '—', email: '—' },
    leadConsultant: '—',
    totalEmissionsYTD: 0,
    yoyDeltaPct: 0,
    employees: 0,
    facilitiesCount: 0,
    dataSourcesActive: 0,
    pendingItems: 0,
    lastActivity: '—',
    engagementSince: new Date(org.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    }),
  };
}

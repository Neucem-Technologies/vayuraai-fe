import { MOCK_EMISSIONS, MOCK_UPLOADS, MOCK_FACTORS, MOCK_FACILITIES, MOCK_REPORTS, MOCK_USERS, MOCK_SME_USERS, MOCK_DASHBOARD_STATS, MOCK_CLIENTS, MOCK_PORTFOLIO_STATS } from '@/lib/mock-data';
import { organisationToClientOrg } from '@/lib/organisation-mapper';
import { getOrganisation, listOrganisations } from '@/lib/organisations-api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, TOKEN_KEY } from '@/hooks/use-auth';

function hasSession(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function useClients() {
  const userType = useAuthStore((s) => s.user?.userType);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessKind = useAuthStore((s) => s.access?.kind);
  return useQuery({
    queryKey: ['clients', isAuthenticated, userType, accessKind],
    queryFn: async () => {
      const access = useAuthStore.getState().access;
      if (access?.kind === 'client_viewer' && access.allowedOrgIds.length > 0) {
        const orgs = await Promise.all(access.allowedOrgIds.map((id) => getOrganisation(id)));
        return orgs.map(organisationToClientOrg);
      }
      if (!isAuthenticated || !hasSession() || userType !== 'consultant') {
        await delay(300);
        return MOCK_CLIENTS;
      }
      const orgs = await listOrganisations();
      return orgs.map(organisationToClientOrg);
    },
  });
}

export function useClient(id: string | null) {
  const userType = useAuthStore((s) => s.user?.userType);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['client', id, isAuthenticated, userType],
    queryFn: async () => {
      if (!id) return null;
      if (!isAuthenticated || !hasSession() || userType !== 'consultant') {
        await delay(200);
        return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
      }
      const org = await getOrganisation(id);
      return organisationToClientOrg(org);
    },
    enabled: !!id,
  });
}

export function usePortfolioStats() {
  const { data: clients } = useClients();
  return useQuery({
    queryKey: ['portfolioStats', clients?.map((c) => c.id).join(',')],
    queryFn: async () => {
      if (!clients?.length) {
        await delay(300);
        return MOCK_PORTFOLIO_STATS;
      }
      const active = clients.filter((c) => c.status === 'Active').length;
      const industries = new Set(clients.map((c) => c.industry)).size;
      return {
        totalClients: clients.length,
        activeEngagements: active,
        industriesCovered: industries,
        reportsInProgress: clients.filter((c) =>
          ['In Progress', 'Behind Schedule', 'Final Review', 'Draft'].includes(c.reportingStatus),
        ).length,
        pendingReviews: clients.reduce((sum, c) => sum + c.pendingItems, 0),
        totalEmissions: clients.reduce((sum, c) => sum + c.totalEmissionsYTD, 0),
      };
    },
    enabled: clients !== undefined,
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useEmissions() {
  return useQuery({
    queryKey: ['emissions'],
    queryFn: async () => {
      await delay(800);
      return MOCK_EMISSIONS;
    },
  });
}

export function useUploads() {
  return useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      await delay(600);
      return MOCK_UPLOADS;
    },
  });
}

export function useUpload(id: string) {
  return useQuery({
    queryKey: ['upload', id],
    queryFn: async () => {
      await delay(400);
      return MOCK_UPLOADS.find(u => u.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useFactors() {
  return useQuery({
    queryKey: ['factors'],
    queryFn: async () => {
      await delay(500);
      return MOCK_FACTORS;
    },
  });
}

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      await delay(300);
      return MOCK_FACILITIES;
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      await delay(400);
      return MOCK_USERS;
    },
  });
}

export function useSmeUsers() {
  return useQuery({
    queryKey: ['smeUsers'],
    queryFn: async () => {
      await delay(400);
      return MOCK_SME_USERS;
    },
  });
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      await delay(600);
      return MOCK_REPORTS;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      await delay(500);
      return MOCK_DASHBOARD_STATS;
    },
  });
}
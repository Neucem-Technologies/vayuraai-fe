import { MOCK_FACILITIES, MOCK_USERS, MOCK_SME_USERS, MOCK_REPORTS } from '@/lib/mock-data';
import { listEmissionFactors } from '@/lib/emission-factors-api';
import { organisationToClientOrg, computePortfolioStats } from '@/lib/portfolio';
import { computeDashboardStats, emptyDashboardStats } from '@/lib/dashboard';
import { getOrganisation, listOrganisations } from '@/lib/organisations-api';
import { getUploadDetail, listUploads, listActivityRecords } from '@/lib/uploads-api';
import { activityRecordToEmission } from '@/lib/activity-record-mapper';
import { uploadDtoToDoc } from '@/lib/upload-mapper';
import { useActiveClientStore } from '@/hooks/use-active-client-store';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, TOKEN_KEY } from '@/hooks/use-auth';
import { useIngestionLiveStore } from '@/hooks/use-ingestion-live';

function hasSession(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function useClients() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const access = useAuthStore((s) => s.access);
  return useQuery({
    queryKey: ['clients', isAuthenticated, access?.kind, access?.allowedOrgIds],
    queryFn: async () => {
      if (!isAuthenticated || !hasSession() || !access) return [];
      if (access.kind === 'client_viewer' && access.allowedOrgIds.length > 0) {
        const orgs = await Promise.all(access.allowedOrgIds.map((id) => getOrganisation(id)));
        return orgs.map(organisationToClientOrg);
      }
      if (access.kind !== 'consultant') return [];
      const orgs = await listOrganisations();
      return orgs.map(organisationToClientOrg);
    },
    enabled: isAuthenticated && !!access,
  });
}

export function useClient(id: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const access = useAuthStore((s) => s.access);
  return useQuery({
    queryKey: ['client', id, isAuthenticated, access?.kind],
    queryFn: async () => {
      if (!id || !isAuthenticated || !hasSession() || !access) return null;
      if (access.kind === 'client_viewer' && !access.allowedOrgIds.includes(id)) {
        return null;
      }
      const org = await getOrganisation(id);
      return organisationToClientOrg(org);
    },
    enabled: !!id && isAuthenticated && !!access,
  });
}

export function usePortfolioStats() {
  const { data: clients } = useClients();
  return useQuery({
    queryKey: ['portfolioStats', clients?.map((c) => c.id).join(',')],
    queryFn: async () => computePortfolioStats(clients ?? []),
    enabled: clients !== undefined,
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useEmissions() {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['emissions', orgId, isAuthenticated],
    queryFn: async () => {
      if (!orgId || !hasSession() || !isAuthenticated) return [];
      const records = await listActivityRecords(orgId);
      return records.map(activityRecordToEmission);
    },
    enabled: !!orgId && isAuthenticated,
  });
}

export function useUploads() {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['uploads', orgId, isAuthenticated],
    queryFn: async () => {
      if (!orgId || !hasSession() || !isAuthenticated) return [];
      const rows = await listUploads(orgId);
      return rows.map((row) => uploadDtoToDoc(row));
    },
    enabled: !!orgId && isAuthenticated,
  });
}

export function useUpload(id: string) {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['upload', orgId, id, isAuthenticated],
    queryFn: async () => {
      if (!orgId || !hasSession() || !isAuthenticated) return null;
      const detail = await getUploadDetail(orgId, id);
      return uploadDtoToDoc(detail.upload, 'You', detail.lineItems.length);
    },
    enabled: !!id && !!orgId && isAuthenticated,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'Processing') return 3000;
      return false;
    },
  });
}

export function useUploadDetail(id: string) {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wsConnected = useIngestionLiveStore((s) => s.wsConnected);
  return useQuery({
    queryKey: ['uploadDetail', orgId, id, isAuthenticated],
    queryFn: async () => {
      if (!orgId || !hasSession() || !isAuthenticated) return null;
      return getUploadDetail(orgId, id);
    },
    enabled: !!id && !!orgId && isAuthenticated,
    refetchInterval: (query) => {
      if (wsConnected) return false;
      const status = query.state.data?.upload.status;
      if (status === 'queued' || status === 'processing') return 3000;
      return false;
    },
  });
}

export function useFactors(options?: { region?: string; year?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const region = options?.region ?? 'India';
  const year = options?.year ?? new Date().getFullYear();
  return useQuery({
    queryKey: ['factors', region, year, isAuthenticated],
    queryFn: async () => {
      if (!hasSession() || !isAuthenticated) return [];
      return listEmissionFactors(region, year);
    },
    enabled: isAuthenticated,
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
      await delay(400);
      return MOCK_REPORTS;
    },
  });
}

export function useDashboardStats() {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const uploadsQuery = useUploads();

  return useQuery({
    queryKey: ['dashboardStats', orgId, uploadsQuery.dataUpdatedAt],
    queryFn: async () => {
      if (!orgId) return emptyDashboardStats();
      return computeDashboardStats(uploadsQuery.data ?? []);
    },
    enabled: !orgId || uploadsQuery.isFetched,
    staleTime: 30_000,
  });
}

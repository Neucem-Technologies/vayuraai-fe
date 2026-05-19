import { MOCK_EMISSIONS, MOCK_UPLOADS, MOCK_FACTORS, MOCK_FACILITIES, MOCK_REPORTS, MOCK_USERS, MOCK_SME_USERS, MOCK_DASHBOARD_STATS, MOCK_CLIENTS, MOCK_PORTFOLIO_STATS } from '@/lib/mock-data';
import { useQuery } from '@tanstack/react-query';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      await delay(300);
      return MOCK_CLIENTS;
    },
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      await delay(200);
      return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
    },
    enabled: !!id,
  });
}

export function usePortfolioStats() {
  return useQuery({
    queryKey: ['portfolioStats'],
    queryFn: async () => {
      await delay(300);
      return MOCK_PORTFOLIO_STATS;
    },
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
import { create } from 'zustand';
import type { ClientOrg } from '@/lib/mock-data';
import { useClient } from '@/hooks/use-data';

interface ActiveClientState {
  activeClientId: string | null;
  setActiveClient: (id: string | null) => void;
}

const STORAGE_KEY = 'vayura_active_client';

const initial = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

export const useActiveClientStore = create<ActiveClientState>((set) => ({
  activeClientId: initial,
  setActiveClient: (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    set({ activeClientId: id });
  },
}));

export function useActiveClient(): ClientOrg | null {
  const id = useActiveClientStore((s) => s.activeClientId);
  const { data } = useClient(id);
  return data ?? null;
}

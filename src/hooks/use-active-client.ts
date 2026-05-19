import { create } from "zustand";
import { MOCK_CLIENTS, type ClientOrg } from "@/lib/mock-data";

interface ActiveClientState {
  activeClientId: string | null;
  setActiveClient: (id: string | null) => void;
  getActiveClient: () => ClientOrg | null;
}

const STORAGE_KEY = "vayura_active_client";

const initial = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

export const useActiveClientStore = create<ActiveClientState>((set, get) => ({
  activeClientId: initial,
  setActiveClient: (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    set({ activeClientId: id });
  },
  getActiveClient: () => {
    const id = get().activeClientId;
    return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
  },
}));

export function useActiveClient(): ClientOrg | null {
  const id = useActiveClientStore((s) => s.activeClientId);
  return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
}

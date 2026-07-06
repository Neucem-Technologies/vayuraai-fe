import { create } from 'zustand';

interface ActiveClientState {
  activeClientId: string | null;
  setActiveClient: (id: string | null) => void;
}

export const ACTIVE_CLIENT_STORAGE_KEY = 'vayura_active_client';

const initial =
  typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY) : null;

export const useActiveClientStore = create<ActiveClientState>((set) => ({
  activeClientId: initial,
  setActiveClient: (id) => {
    if (id) localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, id);
    else localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
    set({ activeClientId: id });
  },
}));

import { create } from 'zustand';

interface ActiveClientState {
  activeClientId: string | null;
  setActiveClient: (id: string | null) => void;
}

/** Legacy global key — migrated into tenant-scoped keys on hydrate. */
export const ACTIVE_CLIENT_STORAGE_KEY = 'vayura_active_client';

export function activeClientStorageKey(tenantId: string | null | undefined): string {
  return tenantId ? `${ACTIVE_CLIENT_STORAGE_KEY}:${tenantId}` : ACTIVE_CLIENT_STORAGE_KEY;
}

export function readStoredActiveClient(tenantId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  if (tenantId) {
    return localStorage.getItem(activeClientStorageKey(tenantId));
  }
  return localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY);
}

export function writeStoredActiveClient(id: string | null, tenantId?: string | null): void {
  if (typeof window === 'undefined') return;
  const key = activeClientStorageKey(tenantId);
  if (id) {
    localStorage.setItem(key, id);
    // Keep legacy key in sync for older code paths during transition.
    localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(key);
    localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
  }
}

const initial =
  typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY) : null;

export const useActiveClientStore = create<ActiveClientState>((set) => ({
  activeClientId: initial,
  setActiveClient: (id) => {
    // Tenant id is stamped by auth hydrate / session sync when known.
    const tenantId =
      typeof window !== 'undefined' ? localStorage.getItem('vayura_active_tenant') : null;
    writeStoredActiveClient(id, tenantId);
    set({ activeClientId: id });
  },
}));

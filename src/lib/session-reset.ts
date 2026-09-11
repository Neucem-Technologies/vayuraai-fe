/** Clear session-scoped client UI state on logout / tenant switch. */
import { useIngestionLiveStore } from '@/hooks/use-ingestion-live';
import { useActiveClientStore } from '@/hooks/use-active-client-store';
import { clearAppQueryCache } from '@/lib/query-client';

export const ACTIVE_TENANT_STORAGE_KEY = 'vayura_active_tenant';

export function clearWorkspaceSessionState(): void {
  clearAppQueryCache();
  useActiveClientStore.getState().setActiveClient(null);
  useIngestionLiveStore.setState({ wsConnected: false, byUpload: {} });
  try {
    localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

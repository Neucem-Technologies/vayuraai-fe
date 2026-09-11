import type { ClientOrg } from '@/lib/portfolio';
import { useClient } from '@/hooks/use-data';
import { useActiveClientStore } from '@/hooks/use-active-client-store';

export { useActiveClientStore, ACTIVE_CLIENT_STORAGE_KEY } from '@/hooks/use-active-client-store';

export function useActiveClient(): ClientOrg | null {
  const id = useActiveClientStore((s) => s.activeClientId);
  const { data } = useClient(id);
  return data ?? null;
}

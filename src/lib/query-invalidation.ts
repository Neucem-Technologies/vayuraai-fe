import type { QueryClient } from '@tanstack/react-query';

/** Invalidate org-scoped data after upload / review / approve / reject / pipeline events. */
export function invalidateOrgWorkspace(
  queryClient: QueryClient,
  orgId?: string | null,
): void {
  void queryClient.invalidateQueries({ queryKey: ['uploads'] });
  void queryClient.invalidateQueries({ queryKey: ['emissions'] });
  void queryClient.invalidateQueries({ queryKey: ['uploadDetail'] });
  void queryClient.invalidateQueries({ queryKey: ['upload'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
  void queryClient.invalidateQueries({ queryKey: ['reports'] });
  void queryClient.invalidateQueries({ queryKey: ['portfolioStats'] });
  void queryClient.invalidateQueries({ queryKey: ['clients'] });
  if (orgId) {
    void queryClient.invalidateQueries({ queryKey: ['client', orgId] });
    void queryClient.invalidateQueries({ queryKey: ['organisation', orgId] });
  }
}

export function invalidateUploadDetail(
  queryClient: QueryClient,
  orgId: string | null | undefined,
  uploadId: string | null | undefined,
): void {
  if (!orgId || !uploadId) {
    void queryClient.invalidateQueries({ queryKey: ['uploadDetail'] });
    void queryClient.invalidateQueries({ queryKey: ['upload'] });
    return;
  }
  void queryClient.invalidateQueries({ queryKey: ['uploadDetail', orgId, uploadId] });
  void queryClient.invalidateQueries({ queryKey: ['upload', orgId, uploadId] });
}

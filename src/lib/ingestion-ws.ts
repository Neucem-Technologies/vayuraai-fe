const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function getIngestionWebSocketUrl(orgId: string, token: string): string | null {
  if (!baseUrl || !orgId || !token) return null;
  const wsBase = baseUrl.replace(/^http/i, (scheme) => (scheme.toLowerCase() === 'https' ? 'wss' : 'ws'));
  const params = new URLSearchParams({ orgId, token });
  return `${wsBase}/ws/ingestion?${params.toString()}`;
}

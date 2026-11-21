import { apiFetch } from '@/lib/api-client';

export type IntegrationProvider = 'tally_file' | 'excel_file' | 'tally_live' | 'zoho_books';

export type IntegrationConnection = {
  id: string;
  provider: IntegrationProvider;
  name: string;
  status: 'active' | 'disabled';
  settings: {
    includeJournals: boolean;
    host: string | null;
    port: number | null;
    companyName: string | null;
  };
  createdAt: string;
};

export type IntegrationRun = {
  id: string;
  status: string;
  windowStart: string | null;
  windowEnd: string | null;
  parsedCount: number;
  createdAt: string;
  completedAt: string | null;
  documentUploadId: string | null;
  connection: { provider: IntegrationProvider; name: string };
  documentUpload: { id: string; originalFilename: string; status: string } | null;
};

export type TallyLiveSettingsInput = {
  status: 'active' | 'disabled';
  includeJournals: boolean;
  host: string;
  port: number;
  companyName: string;
};

export async function listIntegrationConnections(orgId: string): Promise<IntegrationConnection[]> {
  const data = await apiFetch<{ connections: IntegrationConnection[] }>(
    `/api/v1/organisations/${orgId}/integrations/connections`,
  );
  return data.connections;
}

export async function saveTallyLiveConnection(
  orgId: string,
  input: TallyLiveSettingsInput,
): Promise<IntegrationConnection> {
  const data = await apiFetch<{ connection: IntegrationConnection }>(
    `/api/v1/organisations/${orgId}/integrations/connections/tally_live`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
  return data.connection;
}

export async function listIntegrationRuns(orgId: string): Promise<IntegrationRun[]> {
  const data = await apiFetch<{ runs: IntegrationRun[] }>(
    `/api/v1/organisations/${orgId}/integrations/runs`,
  );
  return data.runs;
}

export async function testTallyConnection(orgId: string): Promise<{ reachable: boolean; companies: string[] }> {
  return apiFetch(`/api/v1/organisations/${orgId}/integrations/tally/test`, { method: 'POST' });
}

export async function pullTallyLive(
  orgId: string,
  input: { from: string; to: string },
): Promise<{ uploadId: string | null; runId: string | null; parsedCount: number; imported: boolean; message: string }> {
  return apiFetch(`/api/v1/organisations/${orgId}/integrations/tally/pull`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

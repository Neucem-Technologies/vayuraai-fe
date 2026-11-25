import { ApiRequestError } from '@/lib/api-client';

const MESSAGES: Record<string, string> = {
  TALLY_NOT_CONFIGURED: 'Save the Tally address before pulling data.',
  TALLY_UNREACHABLE: 'Vayura could not reach Tally. Check the address and that TallyPrime is open.',
  TALLY_REJECTED: 'Tally refused the request. Open the company in TallyPrime and try again.',
  CONNECTION_DISABLED: 'Turn the Tally connection back on before pulling data.',
  PULL_IN_PROGRESS: 'A Tally pull is already running. Wait for it to finish.',
  INVALID_WINDOW: 'Choose a start and end date within one financial year.',
  FORBIDDEN: 'Only a firm admin can manage connectors.',
  BAD_REQUEST: 'Check the Tally address and try again.',
};

/** User-facing copy for connector calls. Prefer the server message. */
export function integrationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    if (error.message.trim()) return error.message;
    return MESSAGES[error.code] ?? fallback;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function isIntegrationForbidden(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 403 || error.code === 'FORBIDDEN');
}

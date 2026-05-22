const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = { success: false; error: { code: string; message: string } };

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string | null },
): Promise<T> {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set. Copy .env.example to .env.local.');
  }
  const { accessToken, ...rest } = init ?? {};
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(rest.headers);
  if (!headers.has('Content-Type') && rest.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const res = await fetch(url, {
    ...rest,
    headers,
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json as Partial<ApiErrorBody> | null;
    const code = err?.error?.code ?? (res.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN');
    const message =
      err?.error?.message ??
      (res.status === 409
        ? 'This resource already exists.'
        : res.status === 401
          ? 'You are not authorized to perform this action.'
          : res.status >= 500
            ? 'Something went wrong on our side. Please try again in a moment.'
            : res.statusText || 'Request failed.');
    throw new ApiRequestError(res.status, code, message);
  }
  const body = json as ApiSuccess<T> | null;
  if (!body?.success) {
    throw new ApiRequestError(res.status, 'INVALID_RESPONSE', 'Unexpected response shape.');
  }
  return body.data;
}

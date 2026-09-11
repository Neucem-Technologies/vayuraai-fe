import { apiFetch } from '@/lib/api-client';
import { TOKEN_KEY } from '@/hooks/use-auth';
import type {
  ReportLogoPlacement,
  TenantBrandingPreviewInput,
  TenantBrandingResponse,
  TenantDto,
  UpdateTenantBrandingInput,
} from '@vayura/api-contracts/tenancy';

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
}

export async function updateTenantBranding(
  input: UpdateTenantBrandingInput,
): Promise<TenantDto> {
  const data = await apiFetch<TenantBrandingResponse>('/api/v1/tenant/branding', {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return data.tenant;
}

export async function uploadTenantReportLogo(file: File): Promise<TenantDto> {
  const form = new FormData();
  form.append('logo', file);
  const data = await apiFetch<TenantBrandingResponse>('/api/v1/tenant/branding/logo', {
    method: 'POST',
    accessToken: token(),
    body: form,
  });
  return data.tenant;
}

export async function deleteTenantReportLogo(): Promise<TenantDto> {
  const data = await apiFetch<TenantBrandingResponse>('/api/v1/tenant/branding/logo', {
    method: 'DELETE',
    accessToken: token(),
  });
  return data.tenant;
}

export async function fetchTenantReportLogoBlob(): Promise<Blob | null> {
  const base = apiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/v1/tenant/branding/logo`, {
    headers: token() ? { Authorization: `Bearer ${token()}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.blob();
}

export async function fetchBrandingPreviewPdf(
  input: TenantBrandingPreviewInput,
): Promise<Blob> {
  const base = apiBase();
  if (!base) throw new Error('VITE_API_BASE_URL is not set.');
  const res = await fetch(`${base}/api/v1/tenant/branding/preview-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error('Could not generate branding preview.');
  }
  return res.blob();
}

export function normalizeHexColor(input: string): string | null {
  const raw = input.trim();
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null;
  return withHash.toUpperCase();
}

export type { ReportLogoPlacement };

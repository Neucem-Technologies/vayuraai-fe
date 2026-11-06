import { apiFetch } from "@/lib/api-client";

export type ReportingPeriodDto = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  status: "open" | "closed";
  closedAt: string | null;
  closedByUserId: string | null;
};

export type AuditEventDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string | null;
  actorUserId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export async function listReportingPeriods(orgId: string): Promise<ReportingPeriodDto[]> {
  const data = await apiFetch<{ periods: ReportingPeriodDto[] }>(
    `/api/v1/organisations/${orgId}/reporting-periods`,
  );
  return data.periods;
}

export async function upsertReportingPeriod(
  orgId: string,
  body: { label: string; periodStart: string; periodEnd: string },
): Promise<ReportingPeriodDto> {
  const data = await apiFetch<{ period: ReportingPeriodDto }>(
    `/api/v1/organisations/${orgId}/reporting-periods`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return data.period;
}

export async function closeReportingPeriod(orgId: string, periodId: string): Promise<ReportingPeriodDto> {
  const data = await apiFetch<{ period: ReportingPeriodDto }>(
    `/api/v1/organisations/${orgId}/reporting-periods/${periodId}/close`,
    { method: "POST" },
  );
  return data.period;
}

export async function reopenReportingPeriod(orgId: string, periodId: string): Promise<ReportingPeriodDto> {
  const data = await apiFetch<{ period: ReportingPeriodDto }>(
    `/api/v1/organisations/${orgId}/reporting-periods/${periodId}/reopen`,
    { method: "POST" },
  );
  return data.period;
}

export async function listAuditEvents(
  orgId: string,
  options?: { limit?: number; cursor?: string },
): Promise<{ events: AuditEventDto[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.cursor) params.set("cursor", options.cursor);
  const qs = params.toString();
  return apiFetch<{ events: AuditEventDto[]; nextCursor: string | null }>(
    `/api/v1/organisations/${orgId}/audit/events${qs ? `?${qs}` : ""}`,
  );
}

export async function downloadAssurancePack(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  filenameHint?: string,
): Promise<void> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (!baseUrl) throw new Error("VITE_API_BASE_URL is not set.");
  const url = `${baseUrl}/api/v1/organisations/${orgId}/audit/assurance-pack?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(json?.error?.message ?? "Could not download assurance pack.");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filenameHint ?? `assurance-${periodStart}_${periodEnd}.zip`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

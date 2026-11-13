import { apiFetch } from "@/lib/api-client";
import { fetchSignedPdf } from "@/lib/reports-api";

export type VerifierInviteState = "none" | "pending" | "expired";

export type VerifierRecord = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  status: "invited" | "active";
  pendingInviteId: string | null;
  inviteState: VerifierInviteState;
  inviteExpiresAt: string | null;
};

export type VerificationEngagementStatus = "open" | "under_review" | "queries_raised" | "closed";

export type VerificationThreadSummary = {
  id: string;
  verifierOrgId: string;
  verifierName: string;
  orgId: string;
  clientName: string;
  subject: string;
  status: VerificationEngagementStatus;
  updatedAt: string;
  lastMessage: string;
};

export type VerificationMessage = {
  id: string;
  body: string;
  authorName: string;
  authorSide: "consultant" | "verifier";
  mine: boolean;
  createdAt: string;
};

export function listVerifierDesk() {
  return apiFetch<{ verifiers: VerifierRecord[]; threads: VerificationThreadSummary[] }>("/api/v1/verifiers/desk");
}

export function inviteVerifier(input: { name: string; contactName: string; email: string; note?: string }) {
  return apiFetch<{ inviteToken: string; expiresAt: string; emailSent: boolean; verifierId: string }>(
    "/api/v1/verifiers",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function cancelVerifierInvite(id: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/invites/${id}`, { method: "DELETE" });
}

export function resendVerifierInvite(verifierOrgId: string) {
  return apiFetch<{ inviteToken: string; expiresAt: string; emailSent: boolean; verifierId: string }>(
    `/api/v1/verifiers/${verifierOrgId}/resend-invite`,
    { method: "POST" },
  );
}

export function removePendingVerifier(verifierOrgId: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/${verifierOrgId}`, { method: "DELETE" });
}

export function listVerifierInbox() {
  return apiFetch<{ organisationName: string; threads: VerificationThreadSummary[] }>("/api/v1/verifiers/inbox");
}

export function openVerificationThread(input: {
  verifierOrgId: string;
  orgId: string;
  subject: string;
  message: string;
}) {
  return apiFetch<{ threadId: string }>("/api/v1/verifiers/threads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getVerificationThread(id: string) {
  return apiFetch<{ thread: VerificationThreadSummary; messages: VerificationMessage[] }>(
    `/api/v1/verifiers/threads/${id}`,
  );
}

export type ReviewPackUpload = {
  id: string;
  originalFilename: string;
  status: string;
  facilityLabel: string | null;
  createdAt: string;
  activityDateFrom: string | null;
  activityDateTo: string | null;
};

export type ReviewPackReport = {
  id: string;
  title: string;
  framework: string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  hasPdf: boolean;
};

export type ThreadReviewPack = {
  threadId: string;
  orgId: string;
  clientName: string;
  subject: string;
  uploads: ReviewPackUpload[];
  reports: ReviewPackReport[];
};

export function getThreadReviewPack(threadId: string) {
  return apiFetch<ThreadReviewPack>(`/api/v1/verifiers/threads/${threadId}/review-pack`);
}

export function updateVerificationStatus(threadId: string, status: VerificationEngagementStatus) {
  return apiFetch<{ ok: true; status: VerificationEngagementStatus }>(
    `/api/v1/verifiers/threads/${threadId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export async function downloadVerificationReportPdf(
  threadId: string,
  reportId: string,
  filename: string,
): Promise<void> {
  const signed = await apiFetch<{ url: string; expiresAt: string }>(
    `/api/v1/verifiers/threads/${threadId}/reports/${reportId}/download`,
  );
  const { objectUrl } = await fetchSignedPdf(signed.url);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function postVerificationMessage(id: string, body: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/threads/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function closeVerificationThread(id: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/threads/${id}/close`, { method: "POST" });
}

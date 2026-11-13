import { apiFetch } from "@/lib/api-client";

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

export type VerificationThreadSummary = {
  id: string;
  verifierOrgId: string;
  verifierName: string;
  orgId: string;
  clientName: string;
  subject: string;
  status: "open" | "closed";
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

export function postVerificationMessage(id: string, body: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/threads/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function closeVerificationThread(id: string) {
  return apiFetch<{ ok: true }>(`/api/v1/verifiers/threads/${id}/close`, { method: "POST" });
}

import { apiFetch } from "@/lib/api-client";

export type PolicyUpdate = {
  id: string;
  slug: string;
  title: string;
  jurisdiction: string;
  topic: string;
  stage: string;
  summary: string;
  implication: string;
  sourceName: string;
  sourceUrl: string;
  publishedOn: string;
};

export type SuggestionTarget = "policy" | "factor_library";
export type SuggestionStatus = "submitted" | "in_review" | "accepted" | "declined";

export type LibrarySuggestion = {
  id: string;
  target: SuggestionTarget;
  title: string;
  details: string;
  status: SuggestionStatus;
  reviewNote: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
};

export function listPolicies() {
  return apiFetch<{ items: PolicyUpdate[]; checkedAt: string }>("/api/v1/policies");
}

export function refreshPolicies() {
  return apiFetch<{ items: PolicyUpdate[]; checkedAt: string }>("/api/v1/policies/refresh", {
    method: "POST",
  });
}

export function listSuggestions() {
  return apiFetch<{ suggestions: LibrarySuggestion[] }>("/api/v1/policies/suggestions");
}

export function createSuggestion(input: { target: SuggestionTarget; title: string; details: string }) {
  return apiFetch<{ suggestion: LibrarySuggestion }>("/api/v1/policies/suggestions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function reviewSuggestion(
  id: string,
  input: { status: SuggestionStatus; reviewNote?: string },
) {
  return apiFetch<{ suggestion: LibrarySuggestion }>(`/api/v1/policies/suggestions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

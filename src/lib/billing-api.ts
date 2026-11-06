import type {
  BillingCatalogResponse,
  ConfirmPaymentInput,
  ConfirmPaymentResponse,
  CreateCheckoutInput,
  CreateCheckoutResponse,
  DevActivateInput,
} from "@vayura/api-contracts/billing";
import { apiFetch } from "@/lib/api-client";

export function fetchBillingCatalog() {
  return apiFetch<BillingCatalogResponse>("/api/v1/billing/catalog");
}

export function createCheckout(input: CreateCheckoutInput) {
  return apiFetch<CreateCheckoutResponse>("/api/v1/billing/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmPayment(input: ConfirmPaymentInput) {
  return apiFetch<ConfirmPaymentResponse>("/api/v1/billing/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function devActivatePlan(input: DevActivateInput) {
  return apiFetch<ConfirmPaymentResponse>("/api/v1/billing/dev-activate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

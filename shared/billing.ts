import type { BillingInterval, SubscriptionStatus, TenantPlan } from './common.js';

/** Statuses that block product APIs when BILLING_REQUIRED is on. */
export const UNPAID_SUBSCRIPTION_STATUSES = ['none', 'canceled', 'past_due'] as const satisfies readonly SubscriptionStatus[];

export function isUnpaidSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return (
    status === 'none' ||
    status === 'canceled' ||
    status === 'past_due'
  );
}

export type BillingAudience = 'company' | 'consultant';

export type BillingPlanDto = {
  id: string;
  audience: BillingAudience;
  plan: TenantPlan;
  name: string;
  people: number;
  sitesOrClients: number;
  sitesOrClientsLabel: string;
  reports: string;
  support: string;
  monthlyInr: number;
  yearlyInr: number;
};

export type BillingCatalogResponse = {
  plans: BillingPlanDto[];
  currency: 'INR';
  razorpayKeyId: string | null;
  /** When true, unpaid tenants must complete checkout before using the product. */
  billingRequired: boolean;
  /** Dev-only activate without Razorpay when keys are unset. */
  devBypassEnabled: boolean;
};

export type CreateCheckoutInput = {
  planId: string;
  interval: BillingInterval;
};

export type CreateCheckoutResponse = {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  planId: string;
  planName: string;
  interval: BillingInterval;
  tenantPlan: TenantPlan;
};

export type ConfirmPaymentInput = {
  planId: string;
  interval: BillingInterval;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type ConfirmPaymentResponse = {
  ok: true;
  plan: TenantPlan;
  interval: BillingInterval;
  paidAt: string;
};

export type DevActivateInput = {
  planId: string;
  interval: BillingInterval;
};

import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Cloud } from "lucide-react";
import type { BillingPlanDto } from "@vayura/api-contracts/billing";
import type { BillingInterval } from "@vayura/api-contracts/common";
import { needsBilling, resolvePostLoginPath } from "@vayura/api-contracts/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api-client";
import {
  confirmPayment,
  createCheckout,
  devActivatePlan,
  fetchBillingCatalog,
} from "@/lib/billing-api";
import * as authApi from "@/lib/auth-api";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Billing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { tenant, user, hydrate, onboardingComplete, isAuthenticated, authHydrated, access } =
    useAuthStore();
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authHydrated) return;
    if (!isAuthenticated) setLocation("/login?next=/billing");
  }, [authHydrated, isAuthenticated, setLocation]);

  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login?next=/billing" />;
  if (access?.kind === "verifier") return <Redirect to="/verifier" />;
  if (access?.kind === "client_viewer") return <Redirect to="/client/dashboard" />;

  const catalog = useQuery({ queryKey: ["billing-catalog"], queryFn: fetchBillingCatalog });

  const plans = useMemo(() => {
    const list = catalog.data?.plans ?? [];
    const sme = Boolean(tenant?.smeSolo) || user?.userType === "sme";
    return list.filter((p) => (sme ? p.audience === "company" : p.audience === "consultant"));
  }, [catalog.data?.plans, tenant?.smeSolo, user?.userType]);

  const alreadyPaid = tenant && !needsBilling({
    user: {
      id: user?.id ?? "",
      email: user?.email ?? "",
      userType: user?.userType ?? "consultant",
      fullName: null,
    },
    tenant,
    organisations: [],
    orgMemberships: [],
    access: {
      kind: "consultant",
      tenantRole: tenant.role,
      orgRole: null,
      orgId: null,
      allowedOrgIds: [],
      permissions: {
        readOnly: false,
        canManageClientPortal: false,
        canManageTenant: true,
        canAssignConsultants: false,
      },
      canEnableClientPortal: false,
    },
  });

  const afterPaid = async () => {
    await hydrate();
    const profile = await authApi.fetchMe();
    const { onboardingComplete: done } = useAuthStore.getState();
    setLocation(resolvePostLoginPath(profile, done));
    void queryClient.invalidateQueries({ queryKey: ["billing-catalog"] });
  };

  const pay = useMutation({
    mutationFn: async (plan: BillingPlanDto) => {
      setPayingId(plan.id);
      const order = await createCheckout({ planId: plan.id, interval });
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load Razorpay Checkout.");
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          name: "Vayura AI",
          description: `${plan.name} · ${interval}`,
          order_id: order.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await confirmPayment({
                planId: plan.id,
                interval,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
          theme: { color: "#1F934A" },
        });
        rzp.open();
      });
    },
    onSuccess: async () => {
      toast({ title: "Payment received", description: "Your workspace is ready." });
      await afterPaid();
    },
    onError: (error) => {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Payment failed";
      if (message !== "Payment cancelled") {
        toast({ title: "Checkout failed", description: message, variant: "destructive" });
      }
    },
    onSettled: () => setPayingId(null),
  });

  const bypass = useMutation({
    mutationFn: (plan: BillingPlanDto) => devActivatePlan({ planId: plan.id, interval }),
    onSuccess: async () => {
      toast({ title: "Plan activated (dev)" });
      await afterPaid();
    },
    onError: (error) => {
      toast({
        title: "Could not activate",
        description: error instanceof ApiRequestError ? error.message : "Try again",
        variant: "destructive",
      });
    },
  });

  if (alreadyPaid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">This workspace is already subscribed.</p>
        <Button onClick={() => setLocation(onboardingComplete ? (tenant?.smeSolo ? "/dashboard" : "/clients") : "/onboarding/organization")}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Vayura AI</p>
            <p className="text-xs text-muted-foreground">
              {onboardingComplete ? "Workspace subscription" : "Setup · Step 2 of 3 — billing"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            {onboardingComplete ? "Subscribe to continue" : "Activate your workspace"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {onboardingComplete
              ? "Your subscription is inactive. Pick a plan, pay with Razorpay (UPI, cards, netbanking), then return to the platform."
              : "Organisation created. Choose a plan and pay securely with Razorpay (UPI, cards, netbanking). After payment we finish facilities and data sources, then open the dashboard."}{" "}
            Prices exclude GST. Pay yearly and get two months free.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {(["yearly", "monthly"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={interval === value ? "default" : "outline"}
              onClick={() => setInterval(value)}
            >
              {value === "yearly" ? "Yearly (2 months free)" : "Monthly"}
            </Button>
          ))}
        </div>

        {catalog.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : catalog.isError ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Could not load plans.{" "}
              <button type="button" className="underline" onClick={() => catalog.refetch()}>
                Retry
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const price = interval === "yearly" ? plan.yearlyInr : plan.monthlyInr;
              const busy = payingId === plan.id || bypass.isPending;
              return (
                <Card key={plan.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.people} people · {plan.sitesOrClients} {plan.sitesOrClientsLabel}
                    </CardDescription>
                    <p className="pt-2 text-2xl font-semibold">
                      {formatInr(price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{interval === "yearly" ? "year" : "month"}
                      </span>
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {plan.reports}
                      </li>
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {plan.support}
                      </li>
                    </ul>
                    <div className="mt-auto space-y-2">
                      <Button
                        className="w-full"
                        disabled={busy}
                        onClick={() => pay.mutate(plan)}
                      >
                        {payingId === plan.id ? "Opening checkout…" : "Pay & continue"}
                      </Button>
                      {catalog.data?.devBypassEnabled ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={busy}
                          onClick={() => bypass.mutate(plan)}
                        >
                          Activate without payment (dev)
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

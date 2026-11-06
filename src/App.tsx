import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore, useIsClientViewer } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { AppLayout } from "@/components/layout";
import { ClientLayout } from "@/components/client-layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AcceptClientInvite from "@/pages/accept-client-invite";
import AcceptTeamInvite from "@/pages/accept-team-invite";

import OnboardingOrganization from "@/pages/onboarding/organization";
import OnboardingIndustry from "@/pages/onboarding/industry";
import OnboardingDataSources from "@/pages/onboarding/data-sources";

import Dashboard from "@/pages/dashboard";
import Uploads from "@/pages/uploads";
import Processing from "@/pages/processing";
import Emissions from "@/pages/emissions";
import Reports from "@/pages/reports";
import Offsets from "@/pages/offsets";
import FindConsultants from "@/pages/find-consultants";
import Billing from "@/pages/billing";

import SettingsFactors from "@/pages/settings/factors";
import SettingsOrganization from "@/pages/settings/organization";
import SettingsUsers from "@/pages/settings/users";
import SettingsFirm from "@/pages/settings/firm";
import SettingsControls from "@/pages/settings/controls";
import Policies from "@/pages/policies";
import Verifiers from "@/pages/verifiers";
import VerifierInbox from "@/pages/verifier-inbox";
import AcceptVerifierInvite from "@/pages/accept-verifier-invite";
import Clients from "@/pages/clients";
import { VerifierLayout } from "@/components/verifier-layout";

import ClientDashboard from "@/pages/client/dashboard";
import ClientReports from "@/pages/client/reports";

/** SPA mirror of API requirePaidSubscription — unpaid workspaces stay on /billing. */
function billingBlocked(): boolean {
  const status = useAuthStore.getState().tenant?.subscriptionStatus;
  return status === "none" || status === "canceled" || status === "past_due";
}

function ProtectedRoute({
  component: Component,
  requireOnboarding = true,
  requireActiveClient = false,
  consultantOnly = false,
  requireBilling = true,
}: {
  component: ComponentType;
  requireOnboarding?: boolean;
  requireActiveClient?: boolean;
  consultantOnly?: boolean;
  requireBilling?: boolean;
}) {
  const { isAuthenticated, onboardingComplete, access, authHydrated } = useAuthStore();
  const activeClientId = useActiveClientStore((s) => s.activeClientId);
  const isClientViewer = access?.kind === "client_viewer";

  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (access?.kind === "verifier") {
    return <Redirect to="/verifier" />;
  }

  if (isClientViewer) {
    return <Redirect to="/client/dashboard" />;
  }

  if (requireBilling && billingBlocked()) {
    return <Redirect to="/billing" />;
  }

  if (requireOnboarding && !onboardingComplete) {
    return <Redirect to="/onboarding/organization" />;
  }

  const smeSolo =
    useAuthStore.getState().tenant?.smeSolo || useAuthStore.getState().user?.userType === "sme";

  if (consultantOnly && (access?.kind !== "consultant" || smeSolo)) {
    return <Redirect to="/dashboard" />;
  }

  if (requireActiveClient && !activeClientId) {
    // SME solo has no portfolio page; wait until the org syncs as active client.
    return <Redirect to={smeSolo ? "/dashboard" : "/clients"} />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function operatorHomePath(): "/dashboard" | "/clients" {
  const { tenant, user } = useAuthStore.getState();
  return tenant?.smeSolo || user?.userType === "sme" ? "/dashboard" : "/clients";
}

function ClientProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, access, authHydrated } = useAuthStore();
  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (access?.kind === "verifier") return <Redirect to="/verifier" />;
  if (access?.kind !== "client_viewer") return <Redirect to={operatorHomePath()} />;
  return (
    <ClientLayout>
      <Component />
    </ClientLayout>
  );
}

function VerifierProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, access, authHydrated } = useAuthStore();
  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (access?.kind !== "verifier") return <Redirect to={operatorHomePath()} />;
  return (
    <VerifierLayout>
      <Component />
    </VerifierLayout>
  );
}

function OnboardingRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, access, authHydrated } = useAuthStore();
  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (access?.kind === "verifier") return <Redirect to="/verifier" />;
  if (access?.kind === "client_viewer") return <Redirect to="/client/dashboard" />;
  if (billingBlocked()) return <Redirect to="/billing" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, onboardingComplete, authHydrated, access } = useAuthStore();
  const isClientViewer = useIsClientViewer();

  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated
          ? access?.kind === "verifier"
            ? <Redirect to="/verifier" />
            : isClientViewer
            ? <Redirect to="/client/dashboard" />
            : billingBlocked()
              ? <Redirect to="/billing" />
            : onboardingComplete
              ? <Redirect to={operatorHomePath()} />
              : <Redirect to="/onboarding/organization" />
          : <Redirect to="/signup" />}
      </Route>

      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/register" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/accept-client-invite" component={AcceptClientInvite} />
      <Route path="/accept-team-invite" component={AcceptTeamInvite} />
      <Route path="/accept-verifier-invite" component={AcceptVerifierInvite} />

      <Route path="/billing" component={Billing} />

      <Route path="/onboarding/organization" component={() => <OnboardingRoute component={OnboardingOrganization} />} />
      <Route path="/onboarding/industry" component={() => <OnboardingRoute component={OnboardingIndustry} />} />
      <Route path="/onboarding/data-sources" component={() => <OnboardingRoute component={OnboardingDataSources} />} />

      <Route path="/client/dashboard" component={() => <ClientProtectedRoute component={ClientDashboard} />} />
      <Route path="/client/reports" component={() => <ClientProtectedRoute component={ClientReports} />} />

      <Route path="/clients" component={() => <ProtectedRoute component={Clients} consultantOnly />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} requireActiveClient />} />
      <Route path="/uploads" component={() => <ProtectedRoute component={Uploads} requireActiveClient />} />
      <Route path="/uploads/processing/:id" component={() => <ProtectedRoute component={Processing} requireActiveClient />} />
      <Route path="/emissions" component={() => <ProtectedRoute component={Emissions} requireActiveClient />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} requireActiveClient />} />
      <Route path="/offsets" component={() => <ProtectedRoute component={Offsets} requireActiveClient />} />
      <Route path="/find-consultants" component={() => <ProtectedRoute component={FindConsultants} />} />
      <Route path="/settings/organization" component={() => <ProtectedRoute component={SettingsOrganization} requireActiveClient />} />
      <Route path="/settings/users" component={() => <ProtectedRoute component={SettingsUsers} />} />
      <Route path="/settings/controls" component={() => <ProtectedRoute component={SettingsControls} requireActiveClient />} />
      <Route path="/policies" component={() => <ProtectedRoute component={Policies} consultantOnly />} />
      <Route path="/verifiers" component={() => <ProtectedRoute component={Verifiers} />} />
      <Route path="/verifier" component={() => <VerifierProtectedRoute component={VerifierInbox} />} />
      <Route path="/settings/factors" component={() => <ProtectedRoute component={SettingsFactors} consultantOnly />} />
      <Route path="/settings/firm" component={() => <ProtectedRoute component={SettingsFirm} consultantOnly />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { AppLayout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";

import OnboardingOrganization from "@/pages/onboarding/organization";
import OnboardingIndustry from "@/pages/onboarding/industry";
import OnboardingDataSources from "@/pages/onboarding/data-sources";

import Dashboard from "@/pages/dashboard";
import Uploads from "@/pages/uploads";
import Processing from "@/pages/processing";
import Emissions from "@/pages/emissions";
import Reports from "@/pages/reports";

import SettingsFactors from "@/pages/settings/factors";
import SettingsOrganization from "@/pages/settings/organization";
import SettingsUsers from "@/pages/settings/users";
import SettingsFirm from "@/pages/settings/firm";
import Clients from "@/pages/clients";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  requireOnboarding = true,
  requireActiveClient = false,
  consultantOnly = false,
}: {
  component: ComponentType;
  requireOnboarding?: boolean;
  requireActiveClient?: boolean;
  consultantOnly?: boolean;
}) {
  const { isAuthenticated, onboardingComplete, user } = useAuthStore();
  const activeClientId = useActiveClientStore((s) => s.activeClientId);
  const isSme = user?.userType === "sme";

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireOnboarding && !onboardingComplete) {
    return <Redirect to="/onboarding/organization" />;
  }

  // SMEs trying to access consultant-only pages → their dashboard
  if (consultantOnly && isSme) {
    return <Redirect to="/dashboard" />;
  }

  // SMEs always have an active client (set on login), so skip requireActiveClient check
  if (requireActiveClient && !isSme && !activeClientId) {
    return <Redirect to="/clients" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function OnboardingRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, onboardingComplete, user } = useAuthStore();
  const isSme = user?.userType === "sme";

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated
          ? (onboardingComplete
              ? <Redirect to={isSme ? "/dashboard" : "/clients"} />
              : <Redirect to="/onboarding/organization" />)
          : <Redirect to="/signup" />}
      </Route>

      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/register" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Onboarding */}
      <Route path="/onboarding/organization" component={() => <OnboardingRoute component={OnboardingOrganization} />} />
      <Route path="/onboarding/industry" component={() => <OnboardingRoute component={OnboardingIndustry} />} />
      <Route path="/onboarding/data-sources" component={() => <OnboardingRoute component={OnboardingDataSources} />} />

      {/* Portfolio — consultant only */}
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} consultantOnly />} />

      {/* Active client views — accessible by both, SME always has active client */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} requireActiveClient />} />
      <Route path="/uploads" component={() => <ProtectedRoute component={Uploads} requireActiveClient />} />
      <Route path="/uploads/processing/:id" component={() => <ProtectedRoute component={Processing} requireActiveClient />} />
      <Route path="/emissions" component={() => <ProtectedRoute component={Emissions} requireActiveClient />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} requireActiveClient />} />
      <Route path="/settings/organization" component={() => <ProtectedRoute component={SettingsOrganization} requireActiveClient />} />
      <Route path="/settings/users" component={() => <ProtectedRoute component={SettingsUsers} />} />

      {/* Firm-wide settings — consultant only */}
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

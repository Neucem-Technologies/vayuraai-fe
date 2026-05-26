import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore, useIsClientViewer } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { AppLayout } from "@/components/layout";
import { ClientLayout } from "@/components/client-layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import AcceptClientInvite from "@/pages/accept-client-invite";

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

import ClientDashboard from "@/pages/client/dashboard";
import ClientReports from "@/pages/client/reports";

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
  const { isAuthenticated, onboardingComplete, access } = useAuthStore();
  const activeClientId = useActiveClientStore((s) => s.activeClientId);
  const isClientViewer = access?.kind === "client_viewer";

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (isClientViewer) {
    return <Redirect to="/client/dashboard" />;
  }

  if (requireOnboarding && !onboardingComplete) {
    return <Redirect to="/onboarding/organization" />;
  }

  if (consultantOnly && access?.kind !== "consultant") {
    return <Redirect to="/dashboard" />;
  }

  if (requireActiveClient && !activeClientId) {
    return <Redirect to="/clients" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function ClientProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, access } = useAuthStore();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (access?.kind !== "client_viewer") return <Redirect to="/clients" />;
  return (
    <ClientLayout>
      <Component />
    </ClientLayout>
  );
}

function OnboardingRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, access } = useAuthStore();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (access?.kind === "client_viewer") return <Redirect to="/client/dashboard" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, onboardingComplete } = useAuthStore();
  const isClientViewer = useIsClientViewer();

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated
          ? isClientViewer
            ? <Redirect to="/client/dashboard" />
            : onboardingComplete
              ? <Redirect to="/clients" />
              : <Redirect to="/onboarding/organization" />
          : <Redirect to="/signup" />}
      </Route>

      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/register" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/accept-client-invite" component={AcceptClientInvite} />

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
      <Route path="/settings/organization" component={() => <ProtectedRoute component={SettingsOrganization} requireActiveClient />} />
      <Route path="/settings/users" component={() => <ProtectedRoute component={SettingsUsers} />} />
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

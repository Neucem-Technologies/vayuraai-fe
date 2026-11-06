import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/hooks/use-auth";
import { provisionFirm } from "@/lib/auth-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { TenantPlan } from "@vayura/api-contracts/common";

const schema = z.object({
  firmName: z.string().min(2, "Required"),
  entityType: z.string().min(2, "Required"),
  country: z.string().min(2, "Required"),
  teamSize: z.string().min(1, "Required"),
  primaryService: z.string().optional(),
  plan: z.enum(["Starter", "Pro", "Enterprise"]).optional(),
});

type FormVals = z.infer<typeof schema>;

const PLAN_TO_API: Record<"Starter" | "Pro" | "Enterprise", TenantPlan> = {
  Starter: "starter",
  Pro: "professional",
  Enterprise: "enterprise",
};

export default function OnboardingOrganization() {
  const [, setLocation] = useLocation();
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const userType = useAuthStore((s) => s.user?.userType);
  const isSme = userType === "sme";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupCompany = (() => {
    try {
      return sessionStorage.getItem("vayura_signup_company") ?? "";
    } catch {
      return "";
    }
  })();

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      firmName: signupCompany,
      entityType: "",
      country: "India",
      teamSize: "",
      primaryService: "",
      plan: "Pro",
    },
  });

  const onSubmit = async (values: FormVals) => {
    if (!useAuthStore.getState().isAuthenticated) {
      toast({
        title: "Sign in required",
        description: isSme
          ? "Please sign in again to set up your workspace."
          : "Please sign in again to set up your firm.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await provisionFirm({
        name: values.firmName,
        plan: isSme ? "starter" : PLAN_TO_API[values.plan ?? "Pro"],
        country: values.country,
        entityType: values.entityType,
        teamSize: values.teamSize,
        primaryService: isSme
          ? "Self-serve carbon accounting"
          : values.primaryService || "ESG & Carbon Reporting",
      });
      try {
        sessionStorage.removeItem("vayura_signup_company");
      } catch {
        /* ignore */
      }
      await refreshSession();
      // Pay before finishing setup; /billing sends paid users back into onboarding/home.
      setLocation("/billing");
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : isSme
            ? "Could not create your business workspace."
            : "Could not create your consulting firm workspace.";
      toast({
        title: isSme ? "Could not set up workspace" : "Could not set up firm",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      step={1}
      title={isSme ? "Set up your business workspace" : "Set up your consulting firm"}
      subtitle={
        isSme
          ? "Create a workspace for your organisation. You will upload bills, review activity data, and prepare reports yourself — and you can find a listed consultant later if you need one."
          : "Vayura AI is built for advisors who manage emissions and reporting on behalf of multiple clients. Let's start with your firm details."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isSme ? "Organisation / workspace name" : "Firm legal name"}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-firm-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-entity-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                        <SelectItem value="LLP">Limited Liability Partnership</SelectItem>
                        <SelectItem value="Partnership">Partnership Firm</SelectItem>
                        <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headquartered in</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-country"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="UAE">United Arab Emirates</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="USA">United States</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isSme ? "People in sustainability / finance" : "Consultants on your team"}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-team-size"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["1-5","6-15","16-50","51-200","200+"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isSme ? (
              <FormField
                control={form.control}
                name="primaryService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary service offering</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-service"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ESG & Carbon Reporting">ESG & Carbon Reporting</SelectItem>
                          <SelectItem value="Sustainability Strategy">Sustainability Strategy</SelectItem>
                          <SelectItem value="Climate Risk Advisory">Climate Risk Advisory</SelectItem>
                          <SelectItem value="Audit & Assurance">Audit & Assurance</SelectItem>
                          <SelectItem value="Full-stack Sustainability">Full-stack Sustainability</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {!isSme ? (
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription plan</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-plan"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Starter">Starter</SelectItem>
                          <SelectItem value="Pro">Professional — client portal</SelectItem>
                          <SelectItem value="Enterprise">Enterprise — client portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} data-testid="button-continue">
              {isSubmitting ? (isSme ? "Creating workspace..." : "Creating firm...") : "Continue"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

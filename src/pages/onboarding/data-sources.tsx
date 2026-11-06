import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, useTenant } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client-store";
import { createOrganisation } from "@/lib/organisations-api";
import { createFacility } from "@/lib/facilities-api";
import { FACILITY_TYPES, GENERATION_FACILITY_TYPES, OPERATION_FACILITY_TYPES, resolveFacilityPurpose } from "@/lib/facilities";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgReportingFields } from "@/components/org-reporting-fields";
import {
  orgReportingFormDefaults,
  orgReportingFormSchema,
  reportingFormToApi,
} from "@/lib/org-reporting-profile";

const INDUSTRIES = [
  "IT / ITES",
  "Manufacturing",
  "Cement",
  "Steel",
  "Pharmaceuticals",
  "Textiles",
  "FMCG",
  "Logistics & Transport",
  "Power Generation",
  "Other",
];

const schema = z
  .object({
    legalName: z.string().min(2, "Required"),
    shortName: z.string().min(1, "Required"),
    industry: z.string().min(1, "Required"),
    country: z.string().min(2, "Required"),
    facilityName: z.string().optional(),
    facilityType: z.string().optional(),
    facilityAddress: z.string().optional(),
  })
  .merge(orgReportingFormSchema);

type FormVals = z.infer<typeof schema>;

export default function OnboardingDataSources() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const userType = useAuthStore((s) => s.user?.userType);
  const tenant = useTenant();
  const isSme = userType === "sme" || Boolean(tenant?.smeSolo);
  const setActiveClient = useActiveClientStore((s) => s.setActiveClient);
  const [isFinishing, setIsFinishing] = useState(false);

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
      legalName: signupCompany,
      shortName: "",
      industry: "",
      country: "India",
      facilityName: "",
      facilityType: FACILITY_TYPES[0],
      facilityAddress: "",
      ...orgReportingFormDefaults,
    },
  });

  useEffect(() => {
    if (tenant) return;
    void refreshSession().then(() => {
      if (!useAuthStore.getState().tenant) {
        const sme =
          useAuthStore.getState().user?.userType === "sme" ||
          Boolean(useAuthStore.getState().tenant?.smeSolo);
        toast({
          title: sme ? "Workspace setup required" : "Firm setup required",
          description: sme
            ? "Create your business workspace before adding your organisation."
            : "Create your consulting firm workspace before adding a client.",
          variant: "destructive",
        });
        setLocation("/onboarding/organization");
      }
    });
  }, [tenant, refreshSession, setLocation]);

  const finish = async (values: FormVals) => {
    if (!useAuthStore.getState().tenant) {
      toast({
        title: isSme ? "Workspace setup required" : "Firm setup required",
        description: isSme
          ? "Create your business workspace before adding your organisation."
          : "Create your consulting firm workspace before adding a client.",
        variant: "destructive",
      });
      setLocation("/onboarding/organization");
      return;
    }

    setIsFinishing(true);
    try {
      const org = await createOrganisation({
        legalName: values.legalName,
        shortName: values.shortName,
        industry: values.industry,
        country: values.country,
        ...reportingFormToApi(values),
      });

      const facilityName = values.facilityName?.trim();
      if (facilityName) {
        try {
          await createFacility(org.id, {
            name: facilityName,
            type: values.facilityType?.trim() || FACILITY_TYPES[0],
            purpose: resolveFacilityPurpose(values.facilityType?.trim() || FACILITY_TYPES[0]),
            address: values.facilityAddress?.trim() || "",
            country: values.country,
          });
        } catch (facilityError) {
          const message =
            facilityError instanceof ApiRequestError
              ? facilityError.message
              : "Client was created, but the facility could not be added.";
          toast({
            title: "Client created — facility skipped",
            description: message,
            variant: "destructive",
          });
        }
      }

      await completeOnboarding();
      try {
        sessionStorage.removeItem("vayura_signup_company");
      } catch {
        /* ignore */
      }
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["facilities", org.id] });
      setActiveClient(org.id);
      setLocation("/dashboard");
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : isSme
            ? "Could not create your organisation."
            : "Could not create client organisation.";
      toast({
        title: isSme ? "Could not create organisation" : "Could not add client",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const skip = async () => {
    // SME must create their one organisation — skipping leaves dashboard in a redirect loop.
    if (isSme) {
      toast({
        title: "Organisation required",
        description: "Add your organisation details to finish setup.",
        variant: "destructive",
      });
      return;
    }
    setIsFinishing(true);
    try {
      await completeOnboarding();
      setLocation("/clients");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <OnboardingShell
      step={3}
      title={isSme ? "Add your organisation" : "Add your first client"}
      subtitle={
        isSme
          ? "Create your organisation profile and optionally its first facility. You can upload bills and prepare reports next."
          : "Create a client organisation and optionally its first facility. You can add more anytime from Client profile or Uploads."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(finish)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{isSme ? "Legal name" : "Client legal name"}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-client-name" /></FormControl>
                  <FormDescription>The legal entity that will appear on reports.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-client-short-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-client-industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
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
                <FormItem className="sm:col-span-2">
                  <FormLabel>Country</FormLabel>
                  <FormControl><Input {...field} data-testid="input-client-country" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-lg border p-4">
            <OrgReportingFields control={form.control} />
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-foreground">First facility (optional)</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sites you can assign when uploading documents. Skip if you only need organisation-wide for now.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="facilityName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Facility name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Bengaluru HQ" data-testid="input-onboarding-facility-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-onboarding-facility-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATION_FACILITY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                          {GENERATION_FACILITY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t} (generation)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facilityAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City / site address" data-testid="input-onboarding-facility-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(isSme ? "/onboarding/organization" : "/onboarding/industry")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {!isSme ? (
                <Button type="button" variant="ghost" onClick={skip} disabled={isFinishing} data-testid="button-skip">
                  Skip and explore
                </Button>
              ) : null}
              <Button type="submit" disabled={isFinishing} data-testid="button-finish">
                {isFinishing
                  ? isSme
                    ? "Creating organisation..."
                    : "Creating client..."
                  : isSme
                    ? "Create organisation and continue"
                    : "Add client and continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

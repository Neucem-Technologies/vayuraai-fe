import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { MOCK_CLIENTS } from "@/lib/mock-data";
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

const schema = z.object({
  clientName: z.string().min(2, "Required"),
  industry: z.string().min(1, "Required"),
  fiscalYearStart: z.string().min(1, "Required"),
  reportingStandard: z.enum(["BRSR", "GRI", "BOTH"]),
  contactName: z.string().min(2, "Required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactRole: z.string().min(2, "Required"),
});

type FormVals = z.infer<typeof schema>;

export default function OnboardingDataSources() {
  const [, setLocation] = useLocation();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setActiveClient = useActiveClientStore((s) => s.setActiveClient);
  const [isFinishing, setIsFinishing] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: "TechCorp India Pvt Ltd",
      industry: "IT / ITES",
      fiscalYearStart: "April",
      reportingStandard: "BRSR",
      contactName: "Vivek Bhatia",
      contactEmail: "vivek.b@techcorp.in",
      contactRole: "Head of Sustainability",
    },
  });

  const finish = async (_unused: FormVals) => {
    setIsFinishing(true);
    try {
      await completeOnboarding();
      setActiveClient(MOCK_CLIENTS[0].id);
      setLocation("/dashboard");
    } finally {
      setIsFinishing(false);
    }
  };

  const skip = async () => {
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
      title="Add your first client"
      subtitle="Set up the engagement so you can start uploading data and building reports on their behalf. You can add more clients anytime from the portfolio."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(finish)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Client legal name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-client-name" /></FormControl>
                  <FormDescription>The legal entity that will appear on every report you generate.</FormDescription>
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
                      <SelectTrigger data-testid="select-client-industry"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["IT / ITES", "Manufacturing", "Cement", "Steel", "Pharmaceuticals", "Textiles", "FMCG", "Logistics & Transport", "Power Generation", "Other"].map((i) => (
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
              name="fiscalYearStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal year start</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-fy-start"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["January", "April", "July", "October"].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
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
              name="reportingStandard"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Reporting standard required</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-reporting-standard"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRSR">BRSR (SEBI)</SelectItem>
                        <SelectItem value="GRI">GRI Standards</SelectItem>
                        <SelectItem value="BOTH">Both BRSR and GRI</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t pt-5 -mt-2">
            <div className="text-sm font-medium mb-3">Primary contact at the client</div>
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-contact-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title / role</FormLabel>
                    <FormControl><Input {...field} data-testid="input-contact-role" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} data-testid="input-contact-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setLocation("/onboarding/industry")} data-testid="button-back">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={skip} disabled={isFinishing} data-testid="button-skip">
                Skip and explore
              </Button>
              <Button type="submit" disabled={isFinishing} data-testid="button-finish">
                {isFinishing ? "Setting up workspace..." : "Add client and continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client-store";
import { createOrganisation } from "@/lib/organisations-api";
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

const schema = z.object({
  legalName: z.string().min(2, "Required"),
  shortName: z.string().min(1, "Required"),
  industry: z.string().min(1, "Required"),
  country: z.string().min(2, "Required"),
});

type FormVals = z.infer<typeof schema>;

export default function OnboardingDataSources() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setActiveClient = useActiveClientStore((s) => s.setActiveClient);
  const [isFinishing, setIsFinishing] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalName: "",
      shortName: "",
      industry: "",
      country: "India",
    },
  });

  const finish = async (values: FormVals) => {
    setIsFinishing(true);
    try {
      const org = await createOrganisation({
        legalName: values.legalName,
        shortName: values.shortName,
        industry: values.industry,
        country: values.country,
      });
      await completeOnboarding();
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setActiveClient(org.id);
      setLocation("/dashboard");
    } catch (e) {
      const message =
        e instanceof ApiRequestError ? e.message : "Could not create client organisation.";
      toast({ title: "Could not add client", description: message, variant: "destructive" });
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
      subtitle="Create a client organisation in your portfolio. You can add more clients anytime from the portfolio page."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(finish)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Client legal name</FormLabel>
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
                {isFinishing ? "Creating client..." : "Add client and continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

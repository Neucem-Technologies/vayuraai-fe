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

const schema = z.object({
  firmName: z.string().min(2, "Required"),
  entityType: z.string().min(2, "Required"),
  country: z.string().min(2, "Required"),
  teamSize: z.string().min(1, "Required"),
  primaryService: z.string().min(2, "Required"),
  plan: z.enum(["Starter", "Pro", "Enterprise"]),
});

type FormVals = z.infer<typeof schema>;

export default function OnboardingOrganization() {
  const [, setLocation] = useLocation();

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      firmName: "",
      entityType: "",
      country: "India",
      teamSize: "",
      primaryService: "",
      plan: "Pro",
    },
  });

  const onSubmit = (_unused: FormVals) => {
    setLocation("/onboarding/industry");
  };

  return (
    <OnboardingShell
      step={1}
      title="Set up your consulting firm"
      subtitle="Vayura AI is built for advisors who manage emissions and reporting on behalf of multiple clients. Let's start with your firm details."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firm legal name</FormLabel>
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
                  <FormLabel>Consultants on your team</FormLabel>
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
                        <SelectItem value="Starter">Starter — up to 5 clients</SelectItem>
                        <SelectItem value="Pro">Pro — up to 25 clients</SelectItem>
                        <SelectItem value="Enterprise">Enterprise — unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" data-testid="button-continue">
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

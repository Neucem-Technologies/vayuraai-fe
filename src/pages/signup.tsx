import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Cloud, ArrowRight, Briefcase, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { MOCK_SME_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import * as authApi from "@/lib/auth-api";
import type { UserType } from "@/lib/auth-api";
import { ApiRequestError } from "@/lib/api-client";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid work email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2, "Company name is required"),
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const establishSessionFromLogin = useAuthStore((state) => state.establishSessionFromLogin);
  const setActiveClient = useActiveClientStore((s) => s.setActiveClient);
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<UserType>("consultant");

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      companyName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    try {
      await authApi.register(values.email, values.password, accountType);
      const data = await authApi.login(values.email, values.password);
      await establishSessionFromLogin(data.accessToken, data.user);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const { onboardingComplete, user } = useAuthStore.getState();
      const userType = user?.userType ?? accountType;
      if (userType === "sme") {
        setActiveClient(MOCK_SME_USER.clientId ?? null);
        setLocation(onboardingComplete ? "/dashboard" : "/onboarding/organization");
      } else {
        setLocation(onboardingComplete ? "/clients" : "/onboarding/organization");
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : "Could not create your account. Try a different email or sign in.";
      toast({ variant: "destructive", title: "Could not create account", description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Cloud className="text-primary-foreground w-6 h-6" />
        </div>
        <span className="font-bold text-2xl tracking-tight">Vayura</span>
      </div>

      <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create your account</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary/90">
          Sign in instead
        </Link>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setAccountType("consultant")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            accountType === "consultant"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-testid="signup-toggle-consultant"
        >
          <Briefcase className="w-3.5 h-3.5" />
          Consultant
        </button>
        <button
          type="button"
          onClick={() => setAccountType("sme")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            accountType === "sme"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-testid="signup-toggle-sme"
        >
          <Building2 className="w-3.5 h-3.5" />
          Client SME
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground text-center">
        {accountType === "consultant"
          ? "Consulting team — manage your full client portfolio"
          : "Client contact — view and contribute to your organisation's data"}
      </p>

      <div className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{accountType === "consultant" ? "Consulting firm name" : "Organisation name"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={accountType === "consultant" ? "Your firm name" : "Your company name"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Start 14-day free trial"}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>
        </Form>
      </div>
    </AuthSplitLayout>
  );
}

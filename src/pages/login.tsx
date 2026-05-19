import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Cloud, ArrowRight } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { MOCK_SME_USER } from "@/lib/mock-data";
import * as authApi from "@/lib/auth-api";
import { ApiRequestError } from "@/lib/api-client";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const establishSessionFromLogin = useAuthStore((state) => state.establishSessionFromLogin);
  const setActiveClient = useActiveClientStore((s) => s.setActiveClient);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const data = await authApi.login(values.email, values.password);
      await establishSessionFromLogin(data.accessToken, data.user);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const { onboardingComplete, user } = useAuthStore.getState();
      const userType = user?.userType ?? "consultant";
      if (userType === "sme") {
        setActiveClient(MOCK_SME_USER.clientId ?? null);
        setLocation(onboardingComplete ? "/dashboard" : "/onboarding/organization");
      } else {
        setLocation(onboardingComplete ? "/clients" : "/onboarding/organization");
      }
    } catch (e) {
      const msg = e instanceof ApiRequestError ? e.message : "Sign in failed. Check your email and password.";
      toast({ variant: "destructive", title: "Sign in failed", description: msg });
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

      <h2 className="text-3xl font-semibold tracking-tight text-foreground">Sign in to your account</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
          Start your 14-day free trial
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Account type (consultant or client contact) is set when you sign up and applies each time you sign in.
      </p>

      <div className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="name@company.com" {...field} />
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

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none">Remember me</FormLabel>
                  </FormItem>
                )}
              />
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/90">
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>
        </Form>
      </div>
    </AuthSplitLayout>
  );
}

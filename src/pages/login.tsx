import { useEffect, useState } from "react";
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
import * as authApi from "@/lib/auth-api";
import { resolvePostLoginPath } from "@vayura/api-contracts/profile";
import { getAuthErrorPresentation } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, onboardingComplete, authHydrated } = useAuthStore();
  const establishSessionFromLogin = useAuthStore((state) => state.establishSessionFromLogin);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated) return;
    const { access, onboardingComplete: completed } = useAuthStore.getState();
    if (access?.kind === "client_viewer") {
      setLocation("/client/dashboard");
      return;
    }
    setLocation(completed ? "/clients" : "/onboarding/organization");
  }, [authHydrated, isAuthenticated, onboardingComplete, setLocation]);

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
      const profile = await establishSessionFromLogin(data.accessToken);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const { onboardingComplete } = useAuthStore.getState();
      const path = resolvePostLoginPath(profile, onboardingComplete);
      setLocation(path);
    } catch (e) {
      const { title, description } = getAuthErrorPresentation(e, "login");
      toast({ variant: "destructive", title, description });
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
          Create account
        </Link>
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

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/signup">Create your account</Link>
            </Button>
          </form>
        </Form>
      </div>
    </AuthSplitLayout>
  );
}

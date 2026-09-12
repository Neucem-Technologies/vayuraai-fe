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
import * as authApi from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import { resolvePostLoginPath } from "@vayura/api-contracts/profile";
import type { UserType } from "@vayura/api-contracts/common";
import { getAuthErrorPresentation } from "@/lib/auth-errors";
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
      const profile = await establishSessionFromLogin(data.accessToken, data.user);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const { onboardingComplete } = useAuthStore.getState();
      const path = resolvePostLoginPath(profile, onboardingComplete);
      setLocation(path);
    } catch (e) {
      const { title, description, emailFieldMessage } = getAuthErrorPresentation(e, "signup");
      if (emailFieldMessage) {
        form.setError("email", { type: "server", message: emailFieldMessage });
      }
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

      <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create your account</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary/90">
          Sign in
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

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Sign in to your account</Link>
            </Button>
          </form>
        </Form>
      </div>
    </AuthSplitLayout>
  );
}

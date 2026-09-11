import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptClientInvite } from "@/lib/client-api";
import { useAuthStore } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api-client";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords must match", path: ["confirm"] });

export default function AcceptClientInvite() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const establishSessionFromInvite = useAuthStore((s) => s.establishSessionFromInvite);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!token) {
      setError("Missing invite token. Use the link from your email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await acceptClientInvite(token, values.password);
      await establishSessionFromInvite(result.accessToken, result.orgId);
      setLocation("/client/dashboard");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not complete invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Create a password to access your organisation&apos;s read-only sustainability dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="mt-1" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" className="mt-1" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? "Creating account…" : "Access dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

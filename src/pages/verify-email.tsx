import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiRequestError } from "@/lib/api-client";
import { resendVerification, verifyEmail } from "@/lib/auth-api";

type VerificationStatus = "checking" | "verified" | "error";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "checking" : "error",
  );
  const [error, setError] = useState<string | null>(
    token ? null : "The verification link is missing its token.",
  );

  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem("vayura_signup_email") ?? "";
    } catch {
      return "";
    }
  });

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("The verification link is missing its token.");
      return;
    }

    let active = true;

    async function confirmEmail() {
      try {
        await verifyEmail(token);

        if (active) {
          setStatus("verified");
          setError(null);
        }
      } catch (err) {
        if (active) {
          setStatus("error");
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "This verification link could not be used. Please request another email.",
          );
        }
      }
    }

    void confirmEmail();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendLoading(true);
    setError(null);
    setResendSent(false);

    try {
      await resendVerification(email.trim());
      setResendSent(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not request another verification email. Please try again.",
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "checking"
              ? "Verifying your email"
              : status === "verified"
                ? "Email verified"
                : "Verify your email"}
          </CardTitle>

          <CardDescription>
            {status === "checking"
              ? "Please wait while we confirm your email address."
              : status === "verified"
                ? "Your email address has been successfully verified."
                : "Verify your email address to activate your Vayura account."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "checking" && (
            <p className="text-sm text-muted-foreground">
              Checking your verification link...
            </p>
          )}

          {status === "verified" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is ready. You can now sign in using your email
                address and password.
              </p>

              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                Go to login
              </Button>
            </div>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-destructive">{error}</p>

              <form onSubmit={handleResend} className="space-y-3">
                <div>
                  <Label htmlFor="verification-email">Email address</Label>
                  <Input
                    id="verification-email"
                    type="email"
                    placeholder="name@company.com"
                    className="mt-1"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setResendSent(false);
                    }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resendLoading || !email.trim()}
                >
                  {resendLoading
                    ? "Sending..."
                    : "Resend verification email"}
                </Button>

                {resendSent && (
                  <p className="text-sm text-muted-foreground">
                    If this account requires verification, a new email has
                    been requested. Please check your inbox.
                  </p>
                )}
              </form>

              <Link
                href="/login"
                className="block text-center text-sm text-primary"
              >
                Back to login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

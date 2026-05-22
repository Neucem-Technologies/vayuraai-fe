import { z } from "zod";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cloud, ArrowLeft } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit() {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    setIsSuccess(true);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Cloud className="text-primary-foreground w-8 h-8" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border">
            {isSuccess ? (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-300">
                    We've sent a password reset link to <strong>{form.getValues().email}</strong>. Please check your inbox.
                  </AlertDescription>
                </Alert>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  <div className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send reset link"}
                    </Button>
                    <Link href="/login" className="text-center text-sm font-medium text-primary hover:text-primary/90 flex items-center justify-center">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
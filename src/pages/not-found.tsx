import { Link } from "wouter";
import { Cloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Cloud className="text-primary-foreground w-6 h-6" />
        </div>
        <span className="font-bold text-2xl tracking-tight">Vayura</span>
      </div>
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-primary mb-3">404 — Page not found</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          We couldn't find that page
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The link may be broken, or the page has been moved. Head back to your dashboard to keep working.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";

export function VerifierLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shrink-0">
            <ShieldCheck className="text-primary-foreground w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user?.company ?? "Verifier"}</div>
            <div className="text-xs text-muted-foreground">Third-party verification</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[16rem]">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void logout().then(() => setLocation("/login"));
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto bg-muted/20 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
}

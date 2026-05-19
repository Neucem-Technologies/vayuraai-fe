import type { ReactNode } from "react";
import { Briefcase, Building2 } from "lucide-react";

type AuthSplitLayoutProps = {
  children: ReactNode;
};

/**
 * Shared split-shell for login / signup so colors, column width, and hero panel
 * match the approved UI reference exactly.
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[400px]">{children}</div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1 bg-muted">
        <div className="absolute inset-0 h-full w-full bg-primary/5 flex flex-col items-center justify-center p-12">
          <div className="max-w-md text-center space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                Carbon intelligence for sustainability advisors
              </h3>
              <p className="text-muted-foreground">
                Manage Scope 1, 2, and 3 inventories across every client engagement. Standardised emission factors,
                audit-ready BRSR and GRI reports, and a single workspace for your entire consulting team.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-background/60 rounded-lg p-4 border">
                <Briefcase className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm font-medium">Consultants</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Full portfolio view across all clients, team management, factor library
                </div>
              </div>
              <div className="bg-background/60 rounded-lg p-4 border">
                <Building2 className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm font-medium">Client SMEs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Single-org view to upload documents, review emissions and track reports
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

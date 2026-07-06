import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, LogOut } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function ClientLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout, access } = useAuthStore();
  const orgName = user?.company ?? "Your organisation";

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const nav = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-56 border-r bg-sidebar shrink-0">
        <div className="p-4 border-b">
          <div className="font-semibold text-sm">{orgName}</div>
          <div className="text-xs text-muted-foreground mt-1">Client portal · read-only</div>
          {access?.permissions.readOnly && (
            <div className="text-[11px] text-muted-foreground mt-2">
              {access.canEnableClientPortal === false && access.kind === "client_viewer"
                ? ""
                : "View emissions summaries and download reports shared by your advisor."}
            </div>
          )}
        </div>
        <nav className="p-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <span
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${
                  location.startsWith(href) ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

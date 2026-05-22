import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Upload,
  Cloud,
  FileText,
  Bell,
  Search,
  LogOut,
  Building,
  Users,
  Briefcase,
  ChevronsUpDown,
  Check,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { MOCK_CLIENTS, MOCK_FIRM } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { activeClientId, setActiveClient } = useActiveClientStore();
  const activeClient = MOCK_CLIENTS.find((c) => c.id === activeClientId) ?? null;

  const isSme = user?.userType === "sme";

  const handleLogout = async () => {
    setActiveClient(null);
    await logout();
    setLocation("/login");
  };

  const handleSwitchClient = (id: string) => {
    setActiveClient(id);
    if (location === "/clients") setLocation("/dashboard");
  };

  const clientNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Upload, label: "Uploads", href: "/uploads" },
    { icon: Cloud, label: "Emissions", href: "/emissions" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Building, label: isSme ? "My Organisation" : "Client Profile", href: "/settings/organization" },
    ...(isSme ? [{ icon: Users, label: "Users & Access", href: "/settings/users" }] : []),
  ];

  const firmItems = [
    { icon: FileText, label: "Factor Library", href: "/settings/factors" },
    { icon: Users, label: "Firm Team", href: "/settings/users" },
    { icon: Building2, label: "Firm Settings", href: "/settings/firm" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b h-16 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Cloud className="text-primary-foreground w-5 h-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm tracking-tight">Vayura AI</span>
            <span className="text-[11px] text-sidebar-foreground/60 truncate">
              {isSme ? activeClient?.shortName ?? user?.company : MOCK_FIRM.shortName}
            </span>
          </div>
        </div>

        {/* Consultant: client switcher | SME: org identity badge */}
        {isSme ? (
          <div className="p-3 border-b">
            <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border bg-card text-left">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 bg-primary/10 text-primary">
                {activeClient?.initials ?? "—"}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">Your organisation</span>
                <span className="text-sm font-medium truncate leading-tight">
                  {activeClient?.shortName ?? user?.company}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-primary/20 text-primary bg-primary/10">
                {activeClient?.reportingStandard}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="button-client-switcher"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border bg-card hover:bg-sidebar-accent/50 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                    activeClient ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {activeClient?.initials ?? "—"}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">Active client</span>
                    <span className="text-sm font-medium truncate leading-tight">
                      {activeClient?.shortName ?? "Select a client"}
                    </span>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-foreground/50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                  Switch client ({MOCK_CLIENTS.length})
                </DropdownMenuLabel>
                {MOCK_CLIENTS.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => handleSwitchClient(c.id)}
                    data-testid={`menu-item-client-${c.id}`}
                    className="gap-2"
                  >
                    <div className="w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {c.initials}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{c.shortName}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{c.industry}</span>
                    </div>
                    {c.id === activeClientId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/clients")} data-testid="menu-item-portfolio">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Back to portfolio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {/* Consultant-only: Portfolio section */}
            {!isSme && (
              <>
                <div className="text-xs font-medium text-sidebar-foreground/50 px-3 mb-2 uppercase tracking-wider">Portfolio</div>
                <Link href="/clients">
                  <div
                    data-testid="nav-all-clients"
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      location === "/clients"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    All Clients
                  </div>
                </Link>
              </>
            )}

            {/* Active client nav */}
            <div className="flex items-center justify-between px-3 mt-6 mb-2">
              <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                {isSme ? "My workspace" : "Active client"}
              </span>
              {!isSme && !activeClient && <span className="text-[10px] text-muted-foreground">none</span>}
            </div>
            {clientNavItems.map((item) => {
              const disabled = !isSme && !activeClient;
              return (
                <Link key={item.href} href={disabled ? "/clients" : item.href}>
                  <div
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      disabled
                        ? "text-sidebar-foreground/35 cursor-not-allowed"
                        : location.startsWith(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {/* Consultant-only: Firm section */}
            {!isSme && (
              <>
                <div className="text-xs font-medium text-sidebar-foreground/50 px-3 mt-6 mb-2 uppercase tracking-wider">Firm</div>
                {firmItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        location.startsWith(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* SME: assigned consultant info */}
            {isSme && activeClient && (
              <div className="mt-6 mx-1 p-3 rounded-md border bg-card">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Assigned consultant</div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {activeClient.leadConsultant.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{activeClient.leadConsultant}</div>
                    <div className="text-[10px] text-muted-foreground">Greenedge Advisors</div>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>

        <div className="p-4 border-t shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                data-testid="button-user-menu"
                className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent/50 p-2 rounded-md transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.avatar || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium truncate">{user?.name}</span>
                  <span className="text-xs text-sidebar-foreground/50 truncate">{user?.role}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-0.5">{user?.company}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isSme && (
                <DropdownMenuItem onClick={() => setLocation("/settings/firm")}>Firm Settings</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setLocation("/settings/organization")}>
                {isSme ? "My Organisation" : "Client Profile"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {activeClient && location !== "/clients" && (
              <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isSme ? activeClient.shortName : activeClient.name}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground font-medium">FY {new Date().getFullYear() - 1}-{String(new Date().getFullYear()).slice(-2)}</span>
              </div>
            )}
            <div className="relative w-full max-w-md ml-auto md:ml-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={isSme ? "Search uploads, emissions, reports..." : "Search clients, invoices, reports..."}
                className="w-full pl-9 bg-muted/50 border-none focus-visible:ring-1"
                data-testid="input-global-search"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-avatar-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.avatar || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isSme && (
                  <DropdownMenuItem onClick={() => setLocation("/settings/firm")}>Firm settings</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-muted/20 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}

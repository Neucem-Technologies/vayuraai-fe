import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClients, usePortfolioStats } from "@/hooks/use-data";
import { createOrganisation } from "@/lib/organisations-api";
import { ApiRequestError } from "@/lib/api-client";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { useAuthStore } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  Building2,
  Plus,
  Search,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  FileText,
  Layers,
} from "lucide-react";
import type { ClientOrg } from "@/lib/portfolio";
import { displayValue } from "@/lib/portfolio";

const INDUSTRIES = [
  "IT / ITES",
  "Cement",
  "Textiles",
  "Logistics & Transport",
  "Pharmaceuticals",
  "FMCG",
  "Steel",
  "Power & Energy",
  "Chemicals",
  "Automotive",
  "Real Estate",
  "Hospitality",
  "Banking & Finance",
  "Other",
];

const addClientSchema = z.object({
  legalName: z.string().min(2, "Legal name is required"),
  shortName: z.string().min(1, "Short name is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(2, "Country is required").default("India"),
});

function statusColor(status: ClientOrg["status"]) {
  if (status === "Active") return "bg-primary/10 text-primary border-primary/20";
  if (status === "Onboarding") return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
  return "bg-muted text-muted-foreground border-border";
}

function formatTonnes(kg: number) {
  if (kg === 0) return "—";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toFixed(1);
}

const DIALOG_SELECT_CONTENT_PROPS = {
  position: "popper" as const,
  side: "bottom" as const,
  align: "start" as const,
  sideOffset: 4,
  className: "z-[200] max-h-[min(240px,var(--radix-select-content-available-height))]",
};

export default function Clients() {
  const [, setLocation] = useLocation();
  const { setActiveClient } = useActiveClientStore();
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const queryClient = useQueryClient();
  const { data: clients, isLoading } = useClients();
  const { data: stats } = usePortfolioStats();
  const { toast } = useToast();
  const createClient = useMutation({
    mutationFn: (values: z.infer<typeof addClientSchema>) =>
      createOrganisation({
        legalName: values.legalName,
        shortName: values.shortName,
        industry: values.industry,
        country: values.country,
      }),
    onSuccess: async (org) => {
      setActiveClient(org.id);
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolioStats'] });
      setAddOpen(false);
      addForm.reset();
      toast({
        title: "Client added",
        description: `${org.legalName} is now your active client.`,
      });
    },
    onError: (err) => {
      const message =
        err instanceof ApiRequestError ? err.message : "Could not create client. Please try again.";
      toast({ title: "Could not add client", description: message, variant: "destructive" });
    },
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const addForm = useForm<z.infer<typeof addClientSchema>>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      legalName: "",
      shortName: "",
      industry: "",
      country: "India",
    },
  });

  async function onAddClient(values: z.infer<typeof addClientSchema>) {
    setAdding(true);
    try {
      await createClient.mutateAsync(values);
    } finally {
      setAdding(false);
    }
  }

  const industries = useMemo(() => {
    const set = new Set<string>();
    clients?.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [clients]);

  const filtered = useMemo(() => {
    return (clients ?? [])
      .filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.industry ?? "").toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (industryFilter !== "all" && c.industry !== industryFilter) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, search, statusFilter, industryFilter]);

  const handleOpen = (id: string) => {
    setActiveClient(id);
    setLocation("/dashboard");
  };

  return (
    <div>
      <PageHeader
        title="Client portfolio"
        subtitle="All organizations your firm is currently engaged with"
        actions={
          <Button data-testid="button-add-client" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add client
          </Button>
        }
      />

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Total clients" value={String(stats?.totalClients ?? "—")} icon={Briefcase} />
        <KpiCard label="Active engagements" value={String(stats?.activeEngagements ?? "—")} icon={Building2} />
        <KpiCard label="Industries covered" value={String(stats?.industriesCovered ?? "—")} icon={Layers} />
        <KpiCard label="Reports in progress" value={String(stats?.reportsInProgress ?? "—")} icon={FileText} />
        <KpiCard label="Pending reviews" value={String(stats?.pendingReviews ?? "—")} icon={AlertTriangle} accent="amber" />
        <KpiCard label="Portfolio tCO2e" value={formatTonnes(stats?.totalEmissions ?? 0)} icon={TrendingDown} />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by client name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-52" data-testid="select-industry-filter">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {industries.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-48 animate-pulse">
                <CardContent className="p-6" />
              </Card>
            ))
          : filtered.map((client) => (
              <Card
                key={client.id}
                className="hover-elevate cursor-pointer group"
                onClick={() => handleOpen(client.id)}
                data-testid={`card-client-${client.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                        {client.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-base truncate">{client.shortName}</div>
                        <div className="text-xs text-muted-foreground truncate">{displayValue(client.industry)}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColor(client.status)}>
                      {client.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <div className="text-muted-foreground">Country</div>
                      <div className="font-semibold text-sm mt-0.5">{client.country}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Since</div>
                      <div className="font-semibold text-sm mt-0.5">{client.engagementSince}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge variant="secondary" className="text-[10px] py-0 h-5">
                      {client.clientViewerEnabled ? "Portal enabled" : "Portal off"}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engaged since</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover-elevate">
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {c.initials}
                        </div>
                        <div className="font-medium truncate">{c.shortName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{displayValue(c.industry)}</TableCell>
                    <TableCell className="text-sm">{c.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(c.status)}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.engagementSince}</TableCell>
                    <TableCell className="text-sm">
                      {c.clientViewerEnabled ? "Enabled" : "Off"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpen(c.id)}
                        data-testid={`button-open-client-${c.id}`}
                      >
                        Open
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      No clients match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add client dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
          <DialogHeader>
            <DialogTitle>Add a new client</DialogTitle>
            <DialogDescription>
              Fill in the details below to onboard a new organisation. You can edit all of this later from the client profile.
            </DialogDescription>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddClient)} className="space-y-5 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Legal name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sahyadri Cements Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sahyadri" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        </FormControl>
                        <SelectContent {...DIALOG_SELECT_CONTENT_PROPS}>
                          {INDUSTRIES.map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adding}>
                  {adding ? "Adding client..." : "Add client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  accent?: "amber";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`w-3.5 h-3.5 ${accent === "amber" ? "text-amber-600" : "text-muted-foreground"}`} />
        </div>
        <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

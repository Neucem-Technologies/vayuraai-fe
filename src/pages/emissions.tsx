import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmissions } from "@/hooks/use-data";
import { formatEmissionMass } from "@/lib/format-emissions";
import type { EmissionRecord } from "@/lib/mock-data";

export default function Emissions() {
  const { data: emissions, isLoading } = useEmissions();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [facility, setFacility] = useState("all");
  const [status, setStatus] = useState<"all" | "Approved" | "Ready for Approval" | "Needs Review">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EmissionRecord | null>(null);
  const PAGE_SIZE = 12;

  const facilities = useMemo(
    () =>
      Array.from(
        new Set((emissions ?? []).map((e) => e.facility).filter((f) => f && f !== "—")),
      ),
    [emissions],
  );

  const EMISSION_URGENCY: Record<EmissionRecord["status"], number> = {
    "Needs Review": 0,
    "Ready for Approval": 1,
    "Approved": 2,
  };

  const filtered = (emissions ?? [])
    .filter((e) => {
      if (scope !== "all" && e.scope !== scope) return false;
      if (facility !== "all" && e.facility !== facility) return false;
      if (status !== "all" && e.status !== status) return false;
      if (search && !e.activity.toLowerCase().includes(search.toLowerCase()) && !e.factorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const urgencyDiff = (EMISSION_URGENCY[a.status] ?? 9) - (EMISSION_URGENCY[b.status] ?? 9);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = {
    total: filtered.reduce((acc, e) => acc + e.kgCO2e, 0),
    scope1: filtered.filter((e) => e.scope === "Scope 1").reduce((acc, e) => acc + e.kgCO2e, 0),
    scope2: filtered.filter((e) => e.scope === "Scope 2").reduce((acc, e) => acc + e.kgCO2e, 0),
    scope3: filtered.filter((e) => e.scope === "Scope 3").reduce((acc, e) => acc + e.kgCO2e, 0),
  };

  return (
    <>
      <PageHeader
        title="Emissions ledger"
        subtitle="Every approved activity record with its applied emission factor and traceable source document."
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total emissions", val: totals.total, color: "text-foreground" },
          { label: "Scope 1", val: totals.scope1, color: "text-foreground" },
          { label: "Scope 2", val: totals.scope2, color: "text-foreground" },
          { label: "Scope 3", val: totals.scope3, color: "text-foreground" },
        ].map((m) => {
          const formatted = formatEmissionMass(m.val);
          return (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-xl font-semibold tracking-tight ${m.color}`}>
                  {formatted.amount}
                </span>
                <span className="text-xs text-muted-foreground">{formatted.unit}</span>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4">
            <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Approved">Approved</TabsTrigger>
                <TabsTrigger value="Needs Review">Needs Review</TabsTrigger>
                <TabsTrigger value="Ready for Approval">Ready for Approval</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <div className="relative w-full xl:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search activity or factor..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-full xl:w-36">
                <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scopes</SelectItem>
                <SelectItem value="Scope 1">Scope 1</SelectItem>
                <SelectItem value="Scope 2">Scope 2</SelectItem>
                <SelectItem value="Scope 3">Scope 3</SelectItem>
              </SelectContent>
            </Select>

            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All facilities</SelectItem>
                {facilities.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Factor</TableHead>
                  <TableHead className="text-right">kgCO2e</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                      No matching emission records.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && pageRows.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{e.date}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{e.activity}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">{e.factorName}</div>
                    </TableCell>
                    <TableCell className="text-sm">{e.facility}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground font-medium">{e.scope}</span></TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {e.quantity.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                      <span className="text-muted-foreground ml-1">{e.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{e.emissionFactor}</TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">{e.kgCO2e.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(e)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs tabular-nums">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Emission record</SheetTitle>
                <SheetDescription>Full audit trail for record {selected.id}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Activity</div>
                  <div className="text-sm font-medium text-foreground">{selected.activity}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Date", selected.date],
                    ["Facility", selected.facility],
                    ["Scope", selected.scope],
                    ["Category", selected.category],
                    ["Quantity", `${selected.quantity} ${selected.unit}`],
                    ["Factor value", `${selected.emissionFactor}`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">{k}</div>
                      <div className="text-sm text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Emission factor used</div>
                  <div className="text-sm text-foreground">{selected.factorName}</div>
                </div>
                <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
                  <div className="text-xs text-muted-foreground">Calculated emissions</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {selected.kgCO2e.toLocaleString("en-IN", { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-muted-foreground">kgCO2e</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {selected.quantity} × {selected.emissionFactor} = {selected.kgCO2e.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Source document</div>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" /> {selected.sourceDoc}
                  </Button>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Approval</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {selected.approvedBy && (
                      <span className="text-xs text-muted-foreground">by {selected.approvedBy}</span>
                    )}
                  </div>
                </div>
                {selected.status === "Needs Review" && (
                  <Button className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve record
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

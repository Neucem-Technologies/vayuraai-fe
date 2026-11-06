/**
 * Org controls: close reporting periods, browse audit events, download assurance ZIP.
 * Backend: /organisations/:orgId/reporting-periods and /organisations/:orgId/audit/*
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Lock, Unlock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveClient } from "@/hooks/use-active-client";
import { useIsConsultantAdmin } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api-client";
import {
  closeReportingPeriod,
  downloadAssurancePack,
  listAuditEvents,
  listReportingPeriods,
  reopenReportingPeriod,
  upsertReportingPeriod,
} from "@/lib/controls-api";
import { listRecentFys, readStoredReportingFy } from "@/lib/reporting-fy";
import { toast } from "sonner";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsControls() {
  const activeClient = useActiveClient();
  const orgId = activeClient?.id ?? null;
  const isAdmin = useIsConsultantAdmin();
  const queryClient = useQueryClient();
  const defaultFy = readStoredReportingFy();
  const [label, setLabel] = useState(defaultFy.label);
  const [periodStart, setPeriodStart] = useState(defaultFy.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultFy.periodEnd);
  const [packStart, setPackStart] = useState(defaultFy.periodStart);
  const [packEnd, setPackEnd] = useState(defaultFy.periodEnd);

  const periods = useQuery({
    queryKey: ["reporting-periods", orgId],
    queryFn: () => listReportingPeriods(orgId!),
    enabled: !!orgId,
  });

  const audits = useQuery({
    queryKey: ["audit-events", orgId],
    queryFn: () => listAuditEvents(orgId!, { limit: 40 }),
    enabled: !!orgId,
  });

  const fyPresets = useMemo(() => listRecentFys(4), []);

  const upsert = useMutation({
    mutationFn: () => upsertReportingPeriod(orgId!, { label, periodStart, periodEnd }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reporting-periods", orgId] });
      toast.success("Reporting period saved");
    },
    onError: (e) =>
      toast.error("Could not save period", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      }),
  });

  const closeMut = useMutation({
    mutationFn: (periodId: string) => closeReportingPeriod(orgId!, periodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reporting-periods", orgId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-events", orgId] });
      toast.success("Period closed — approvals in this window are blocked");
    },
    onError: (e) =>
      toast.error("Could not close period", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      }),
  });

  const reopenMut = useMutation({
    mutationFn: (periodId: string) => reopenReportingPeriod(orgId!, periodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reporting-periods", orgId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-events", orgId] });
      toast.success("Period reopened");
    },
    onError: (e) =>
      toast.error("Could not reopen period", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      }),
  });

  const packMut = useMutation({
    mutationFn: () => downloadAssurancePack(orgId!, packStart, packEnd),
    onSuccess: () => toast.success("Assurance pack downloaded"),
    onError: (e) =>
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "Try again.",
      }),
  });

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">Select an organisation to manage controls.</p>;
  }

  return (
    <>
      <PageHeader
        title="Controls & assurance"
        subtitle="Close reporting periods, review the audit trail, and export an assurance evidence pack."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reporting periods</CardTitle>
            <CardDescription>
              Closed periods block new activity approvals for dates inside the window. Reopening requires an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {fyPresets.map((fy) => (
                <Button
                  key={fy.startYear}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLabel(fy.label);
                    setPeriodStart(fy.periodStart);
                    setPeriodEnd(fy.periodEnd);
                  }}
                >
                  {fy.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Label>Label</Label>
                <Input className="mt-1" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div>
                <Label>Start</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => upsert.mutate()}
                  disabled={upsert.isPending || !label.trim()}
                >
                  Save period
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.isLoading && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!periods.isLoading && (periods.data?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No periods yet — save an Indian FY window above.
                      </TableCell>
                    </TableRow>
                  )}
                  {periods.data?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.periodStart} → {p.periodEnd}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "closed" ? "secondary" : "outline"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "open" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => closeMut.mutate(p.id)}
                            disabled={closeMut.isPending}
                          >
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Close
                          </Button>
                        ) : isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reopenMut.mutate(p.id)}
                            disabled={reopenMut.isPending}
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Reopen
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Admin only</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assurance pack</CardTitle>
            <CardDescription>
              ZIP of ledger lines, audit events, uploads, reports metadata, offsets, and period locks for the selected window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {fyPresets.map((fy) => (
                <Button
                  key={`pack-${fy.startYear}`}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPackStart(fy.periodStart);
                    setPackEnd(fy.periodEnd);
                  }}
                >
                  {fy.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Period start</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={packStart}
                  onChange={(e) => setPackStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Period end</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={packEnd}
                  onChange={(e) => setPackEnd(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => packMut.mutate()} disabled={packMut.isPending}>
              <Download className="w-4 h-4 mr-2" />
              Download ZIP
            </Button>
            <p className="text-xs text-muted-foreground">
              Inventory totals in reports exclude carbon offsets unless a disclosure explicitly states otherwise.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
          <CardDescription>Recent control events for this organisation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.isLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {!audits.isLoading && (audits.data?.events.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      No audit events yet.
                    </TableCell>
                  </TableRow>
                )}
                {audits.data?.events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatWhen(ev.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{ev.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ev.summary ?? `${ev.entityType} ${ev.entityId}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

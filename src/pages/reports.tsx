import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Plus,
  Eye,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReports, useClient, useFacilities, useEmissions } from "@/hooks/use-data";
import { useActiveClientStore } from "@/hooks/use-active-client-store";
import { useAuthStore } from "@/hooks/use-auth";
import {
  createReport,
  downloadReportPdf,
  fetchReportPdfBlob,
  submitReport,
  type CreateReportRequest,
  type ReportDto,
} from "@/lib/reports-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ORGANISATION_WIDE_FACILITY } from "@/lib/facilities";
import { defaultReportingPeriod } from "@/lib/reporting-period";

const TEMPLATES = [
  {
    id: "BRSR",
    name: "BRSR Core",
    standard: "BRSR",
    description:
      "SEBI Business Responsibility & Sustainability Report — Section A through E with all NGRBC principles.",
    sections: 9,
  },
  {
    id: "GRI",
    name: "GRI Standards 2021",
    standard: "GRI",
    description: "Universal, sector-specific, and topic-specific disclosures aligned to GRI 2021.",
    sections: 12,
  },
  {
    id: "GHG",
    name: "GHG Protocol Inventory",
    standard: "GHG",
    description:
      "Comprehensive Scope 1, 2, and 3 inventory with optional market vs. location-based reporting.",
    sections: 6,
  },
] as const;

function statusIcon(status: ReportDto["status"]) {
  if (status === "submitted") return CheckCircle2;
  if (status === "failed") return AlertTriangle;
  if (status === "final") return FileText;
  return Clock;
}

function statusTone(status: ReportDto["status"]) {
  if (status === "submitted") return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  if (status === "final") return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  return "bg-muted text-muted-foreground";
}

export default function Reports() {
  const queryClient = useQueryClient();
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const tenantId = useAuthStore((s) => s.tenant?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: client } = useClient(orgId);
  const { data: reports, isLoading } = useReports();
  const { data: facilities = [] } = useFacilities();
  const { data: emissions = [] } = useEmissions();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<CreateReportRequest["framework"]>("BRSR");
  const suggestedPeriod = useMemo(
    () => defaultReportingPeriod(emissions.map((e) => e.date).filter(Boolean)),
    [emissions],
  );
  const [periodStart, setPeriodStart] = useState(suggestedPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(suggestedPeriod.end);
  const [boundary, setBoundary] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const reportsQueryKey = useMemo(
    () => ["reports", tenantId, orgId, isAuthenticated] as const,
    [tenantId, orgId, isAuthenticated],
  );

  useEffect(() => {
    setPeriodStart(suggestedPeriod.start);
    setPeriodEnd(suggestedPeriod.end);
  }, [orgId, suggestedPeriod.start, suggestedPeriod.end]);

  const boundaryOptions = useMemo(() => {
    const opts = [
      { value: "all", label: "All facilities (operational control)" },
      { value: "india", label: "India operations only" },
    ];
    for (const f of facilities) {
      if (f.name !== ORGANISATION_WIDE_FACILITY) {
        opts.push({ value: f.name, label: f.name });
      }
    }
    return opts;
  }, [facilities]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!orgId) throw new Error("Select a client organisation first.");
      return createReport(orgId, {
        framework: template,
        periodStart,
        periodEnd,
        boundaryLabel: boundary,
      });
    },
    onSuccess: async (report) => {
      // Show the new row immediately (API returns status "generating").
      queryClient.setQueryData<ReportDto[]>(reportsQueryKey, (prev) => {
        const list = prev ?? [];
        if (list.some((r) => r.id === report.id)) {
          return list.map((r) => (r.id === report.id ? report : r));
        }
        return [report, ...list];
      });
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setOpen(false);
      toast.success("Report generation started", {
        description: `${report.name} will appear as Ready when the PDF finishes.`,
      });
    },
    onError: (e) => {
      toast.error("Could not generate report", {
        description: e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Try again.",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (reportId: string) => {
      if (!orgId) throw new Error("No client selected");
      return submitReport(orgId, reportId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report marked as submitted");
    },
    onError: (e) => {
      toast.error("Submit failed", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const onDownload = async (report: ReportDto) => {
    if (!orgId) return;
    try {
      await downloadReportPdf(orgId, report.id, report.name);
    } catch (e) {
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "PDF may still be generating.",
      });
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  };

  const onPreview = async (report: ReportDto) => {
    if (!orgId) return;
    setPreviewLoadingId(report.id);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const content = await fetchReportPdfBlob(orgId, report.id);
      setPreviewUrl(content.objectUrl);
      setPreviewName(report.name);
      setPreviewOpen(true);
    } catch (e) {
      toast.error("Preview failed", {
        description: e instanceof Error ? e.message : "PDF may still be generating.",
      });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  if (!orgId) {
    return (
      <>
        <PageHeader
          title="Reports"
          subtitle="Select a client organisation to generate and manage disclosure reports."
        />
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground text-center">
            Choose a client from the header switcher to view that organisation’s reports. Reports are
            never shared across firms or clients.
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          client
            ? `Generate and submit audit-ready disclosures for ${client.name}.`
            : "Generate, manage, and submit audit-ready disclosures aligned to BRSR, GRI, and the GHG Protocol."
        }
        actions={
          <Button onClick={() => setOpen(true)} data-testid="button-new-report">
            <Plus className="w-4 h-4 mr-2" />
            New report
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {TEMPLATES.map((t) => (
          <Card
            key={t.id}
            className="hover-elevate cursor-pointer"
            onClick={() => {
              setTemplate(t.id);
              setOpen(true);
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  {t.standard}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{t.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t.sections} sections</span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  Generate <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
          <CardDescription>
            Drafts, finalized, and submitted reports for {client?.name ?? "this client"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Total emissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && (reports?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      No reports yet for this client. Generate a BRSR, GRI, or GHG inventory from approved
                      emissions.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  reports?.map((r) => {
                    const Icon = statusIcon(r.status);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                                statusTone(r.status),
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{r.name}</div>
                              <div className="text-xs text-muted-foreground">by {r.generatedBy}</div>
                              {r.failureReason && (
                                <div className="text-xs text-destructive mt-0.5">{r.failureReason}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                            {r.framework}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.periodLabel}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.generatedAt ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums font-medium">
                          {r.totalTonnesCO2e.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                          <span className="text-xs text-muted-foreground ml-1">tCO2e</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            {r.status === "final" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={submitMutation.isPending}
                                onClick={() => submitMutation.mutate(r.id)}
                              >
                                <Send className="w-4 h-4 mr-1" /> Submit
                              </Button>
                            )}
                            {(r.status === "final" || r.status === "submitted") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={previewLoadingId === r.id}
                                  onClick={() => void onPreview(r)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {previewLoadingId === r.id ? "Loading…" : "Preview"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void onDownload(r)}>
                                  <Download className="w-4 h-4 mr-1" /> PDF
                                </Button>
                              </>
                            )}
                            {r.status === "generating" && (
                              <Button variant="ghost" size="sm" disabled>
                                <Eye className="w-4 h-4 mr-1" /> Generating…
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) closePreview();
          else setPreviewOpen(true);
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Report preview</DialogTitle>
            <DialogDescription>
              {previewName} — rendered with your current firm branding settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-md border overflow-hidden bg-muted/20">
            {previewUrl ? (
              <iframe title={previewName} src={previewUrl} className="w-full h-full border-0" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate new report</DialogTitle>
            <DialogDescription>
              Roll up approved emissions for {client?.name ?? "this client"} into a disclosure PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Template</Label>
              <Select
                value={template}
                onValueChange={(v) => setTemplate(v as CreateReportRequest["framework"])}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.standard})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">From</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">To</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Reporting boundary</Label>
              <Select value={boundary} onValueChange={setBoundary}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boundaryOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Period defaults to the Indian FY covering this client’s latest approved activity
                ({suggestedPeriod.start} → {suggestedPeriod.end}). Only ledger rows inside that window
                are included.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending || !periodStart || !periodEnd}
              onClick={() => createMutation.mutate()}
              data-testid="button-start-report-generation"
            >
              <FileText className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Generating…" : "Start generation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUploadDetail, useFactors, useClient, useFacilities } from "@/hooks/use-data";
import { useIngestionLiveStore } from "@/hooks/use-ingestion-live";
import { PipelineProgress } from "@/components/pipeline-progress";
import { EmissionFactorSelect } from "@/components/emission-factor-select";
import { type ConfidenceLevel, type ExtractedLineItem, type EmissionFactor } from "@/lib/mock-data";
import { mergeFactorOptions } from "@/lib/factor-options";
import { useActiveClientStore } from "@/hooks/use-active-client-store";
import { uploadDtoToDoc } from "@/lib/upload-mapper";
import { approveUpload, saveUploadReview, type ReviewLineInput } from "@/lib/uploads-api";
import { cn } from "@/lib/utils";
import { friendlyIngestionError } from "@/lib/ingestion-errors";
import { formatEmissionMass } from "@/lib/format-emissions";
import { computeLineKgCo2e } from "@/lib/emission-calc";
import { ORGANISATION_WIDE_FACILITY } from "@/lib/facilities";
import { toast } from "sonner";

type ReviewLineItem = ExtractedLineItem & {
  rowIndex?: number;
  facility?: string;
  kgCO2e?: number;
  factorValue?: number;
  factorName?: string;
  factorUnit?: string;
  originalUnit?: string;
  spendAmount?: number;
};

function inferReportingYear(dates: string[]): number {
  const years = dates
    .map((d) => Number.parseInt(d.slice(0, 4), 10))
    .filter((y) => Number.isFinite(y) && y >= 1990 && y <= 2100);
  return years.length > 0 ? Math.max(...years) : new Date().getFullYear();
}

function lineKgCo2e(item: ReviewLineItem, factorsById: Map<string, EmissionFactor>): number {
  const f = factorsById.get(item.factorId);
  const factorValue = f?.value ?? item.factorValue ?? 0;
  const factorUnit = f?.unit ?? item.factorUnit ?? "";
  if (!item.factorId || factorValue <= 0) return item.kgCO2e ?? 0;

  return computeLineKgCo2e({
    quantity: item.quantity,
    unit: item.unit,
    originalUnit: item.originalUnit,
    spendAmount: item.spendAmount,
    factorValue,
    factorUnit,
  });
}

function ConfidenceDot({ level }: { level: ConfidenceLevel }) {
  const map = {
    high: { color: "bg-green-500", label: "High" },
    medium: { color: "bg-amber-500", label: "Medium" },
    low: { color: "bg-red-500", label: "Low" },
  } as const;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", map[level].color)} />
      <span className="text-xs text-muted-foreground">{map[level].label}</span>
    </div>
  );
}

export default function Processing() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const { data: client } = useClient(orgId);
  const { data: detail, isLoading } = useUploadDetail(params.id);
  const live = useIngestionLiveStore((s) => (params.id ? s.byUpload[params.id] : undefined));
  const wsConnected = useIngestionLiveStore((s) => s.wsConnected);

  const reportingYear = useMemo(
    () => inferReportingYear(detail?.lineItems.map((l) => l.date) ?? []),
    [detail?.lineItems],
  );
  const { data: libraryFactors = [] } = useFactors({
    region: client?.country ?? 'India',
    year: reportingYear,
  });
  const { data: orgFacilities = [] } = useFacilities();

  const factorOptions = useMemo(
    () => mergeFactorOptions(libraryFactors, detail?.lineItems ?? []),
    [libraryFactors, detail?.lineItems],
  );
  const factorsById = useMemo(
    () => new Map(factorOptions.map((f) => [f.id, f])),
    [factorOptions],
  );

  const upload = detail ? uploadDtoToDoc(detail.upload, "You", detail.lineItems.length) : null;

  const initialItems = useMemo((): ReviewLineItem[] => {
    if (!detail?.lineItems.length) return [];
    return detail.lineItems.map((line) => ({
      id: line.id,
      rowIndex: line.rowIndex,
      description: line.description,
      category: line.category,
      quantity: line.quantity,
      unit: line.unit,
      vendor: line.vendor,
      date: line.date || "—",
      facility: line.facility,
      confidence: line.confidence as ConfidenceLevel,
      factorId: line.factorId,
      factorName: line.factorName,
      factorValue: line.factorValue,
      factorUnit: line.factorUnit,
      originalUnit: line.originalUnit,
      spendAmount: line.spendAmount,
      kgCO2e: line.kgCO2e,
    }));
  }, [detail?.lineItems]);

  const [items, setItems] = useState<ReviewLineItem[]>([]);
  const [page, setPage] = useState(1);
  const [dirty, setDirty] = useState(false);

  const facilityOptions = useMemo(() => {
    const names = new Set<string>([ORGANISATION_WIDE_FACILITY]);
    for (const f of orgFacilities) names.add(f.name);
    if (detail?.upload.facilityLabel) names.add(detail.upload.facilityLabel);
    for (const item of items) {
      if (item.facility?.trim()) names.add(item.facility.trim());
    }
    return Array.from(names);
  }, [orgFacilities, detail?.upload.facilityLabel, items]);

  const isApproved = Boolean(detail?.upload.reviewedAt);
  const canReview =
    !isApproved &&
    (detail?.upload.status === "needs_review" || detail?.upload.status === "completed") &&
    items.length > 0;

  const toReviewPayload = (rows: ReviewLineItem[]): ReviewLineInput[] =>
    rows.map((item, index) => ({
      id: item.id,
      rowIndex: item.rowIndex ?? index + 1,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      vendor: item.vendor === "—" ? "" : item.vendor,
      date: item.date === "—" ? "" : item.date,
      facility: item.facility ?? "",
      confidence: item.confidence,
      factorId: item.factorId,
      originalUnit: item.originalUnit,
      spendAmount: item.spendAmount,
    }));

  const saveReviewMutation = useMutation({
    mutationFn: () => {
      if (!orgId || !params.id) throw new Error("Missing upload context");
      return saveUploadReview(orgId, params.id, { lines: toReviewPayload(items) });
    },
    onSuccess: () => {
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["uploadDetail", orgId, params.id] });
      toast.success("Review saved", {
        description: "Your edits are saved. Approve when you are ready to post to the ledger.",
      });
    },
    onError: (error: Error) => {
      toast.error("Could not save review", { description: error.message });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!orgId || !params.id) throw new Error("Missing upload context");
      return approveUpload(orgId, params.id, { lines: toReviewPayload(items) });
    },
    onSuccess: (data) => {
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["uploadDetail", orgId, params.id] });
      void queryClient.invalidateQueries({ queryKey: ["uploads", orgId] });
      void queryClient.invalidateQueries({ queryKey: ["emissions", orgId] });
      toast.success("Approved and posted", {
        description: (() => {
          const f = formatEmissionMass(data.totalKgCO2e);
          return `${data.activityRecordCount} line${data.activityRecordCount === 1 ? "" : "s"} added to emissions (${f.amount} ${f.unit}).`;
        })(),
      });
      setLocation("/emissions");
    },
    onError: (error: Error) => {
      toast.error("Could not approve upload", { description: error.message });
    },
  });

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setDirty(false);
  }, [initialItems]);
  const PAGE_SIZE = 8;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lowCount = items.filter((i) => i.confidence === "low").length;
  const highCount = items.filter((i) => i.confidence === "high").length;

  const updateItem = (id: string, patch: Partial<typeof items[number]>) => {
    setDirty(true);
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const totalEmissions = items.reduce((acc, i) => acc + lineKgCo2e(i, factorsById), 0);
  const totalFormatted = formatEmissionMass(totalEmissions);

  if (isLoading || !upload || !detail) {
    return (
      <>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-96" />
      </>
    );
  }

  const isProcessing =
    (live?.uploadStatus ?? detail?.upload.status) === "queued" ||
    (live?.uploadStatus ?? detail?.upload.status) === "processing";

  const pipelineCompleted =
    detail?.upload.status === "completed" ||
    detail?.upload.status === "needs_review" ||
    live?.uploadStatus === "completed" ||
    live?.uploadStatus === "needs_review";

  const isFailed =
    detail?.upload.status === "failed" || live?.uploadStatus === "failed";

  const activeStepLabel = live?.stepLabel;

  return (
    <>
      <Link href="/uploads">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to uploads
        </Button>
      </Link>

      {isFailed && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-foreground">Processing failed</div>
              <p className="text-muted-foreground mt-1">
                {friendlyIngestionError(detail.upload.failureReason ?? detail.pipeline?.errorMessage)}
              </p>
              {items.length > 0 && (
                <p className="text-muted-foreground mt-2">
                  Partial results from earlier steps are shown below. Re-upload after fixing the issue to run the full pipeline.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                {upload.type === "Excel" || upload.type === "CSV"
                  ? <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                  : <FileText className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{upload.filename}</h2>
                  <StatusBadge status={upload.status} />
                </div>
                <div className="mt-1 flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                  <span>{upload.facility}</span>
                  <span>•</span>
                  <span>{upload.category}</span>
                  <span>•</span>
                  <span>Uploaded by {upload.uploadedBy}</span>
                  <span>•</span>
                  <span>{upload.size}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Calculated total</div>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {totalFormatted.amount}{" "}
              <span className="text-sm font-normal text-muted-foreground">{totalFormatted.unit}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>{highCount} high confidence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>{lowCount} need review</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm space-y-3 w-full">
            <div>
              <div className="font-medium text-foreground">Extraction summary</div>
              <p className="text-muted-foreground mt-1 leading-snug">
                {isProcessing
                  ? activeStepLabel
                    ? `Vayura is running ${activeStepLabel.toLowerCase()}… This page updates live${wsConnected ? "" : " (reconnecting…)"}.`
                    : "Vayura is reading your document and extracting activity lines. This page updates live as each step completes."
                  : pipelineCompleted
                    ? isApproved
                      ? "This upload has been approved and posted to the emissions ledger."
                      : "Processing and emission factor calculation are complete. Review the extracted lines below before approving."
                    : pipelineCompleted && items.length === 0
                    ? "Pipeline finished but no activity lines were found in this document. Try a CSV export, or check that the PDF contains readable text (scanned images need manual review)."
                    : items.length === 0
                      ? "No activity lines could be extracted from this document. Scanned PDFs and image-only files need manual review."
                      : `Vayura extracted ${items.length} line items from this document. ${lowCount} items have low confidence and need your review before they can be approved. You can edit any quantity, vendor, or emission factor below.`}
              </p>
            </div>
            <PipelineProgress
              isActive={isProcessing}
              currentStep={live?.currentStep ?? detail.pipeline?.currentStep}
              completedSteps={live?.completedSteps ?? detail.pipeline?.completedSteps ?? []}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extracted line items</CardTitle>
          <CardDescription>Review, edit, and approve each row before posting to your emissions ledger.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Emission factor</TableHead>
                  <TableHead className="text-right">kgCO2e</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                      {isProcessing ? "Extracting line items…" : "No extracted line items to review."}
                    </TableCell>
                  </TableRow>
                ) : (
                pageItems.map((item) => {
                  const co2 = lineKgCo2e(item, factorsById);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </TableCell>
                      <TableCell className="text-sm">{item.vendor}</TableCell>
                      <TableCell>
                        <Select
                          value={item.facility || ORGANISATION_WIDE_FACILITY}
                          disabled={!canReview}
                          onValueChange={(v) => updateItem(item.id, { facility: v })}
                        >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="max-h-72 z-[200]">
                            {facilityOptions.map((name) => (
                              <SelectItem key={name} value={name} className="text-xs">
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.quantity}
                          disabled={!canReview}
                          onChange={(e) => {
                            const quantity = parseFloat(e.target.value) || 0;
                            const draft = { ...item, quantity };
                            updateItem(item.id, {
                              quantity,
                              kgCO2e: lineKgCo2e(draft as ReviewLineItem, factorsById),
                            });
                          }}
                          className="h-8 w-24 text-right tabular-nums ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      <TableCell>
                        <EmissionFactorSelect
                          factors={factorOptions}
                          line={{
                            description: item.description,
                            category: item.category,
                            unit: item.unit,
                          }}
                          value={item.factorId}
                          selectedName={item.factorName}
                          disabled={!canReview}
                          onValueChange={(v, next) => {
                            const patch: Partial<ReviewLineItem> = {
                              factorId: v,
                              factorName: next?.name,
                              factorValue: next?.value,
                              factorUnit: next?.unit,
                            };
                            const draft = { ...item, ...patch };
                            patch.kgCO2e = lineKgCo2e(
                              draft as ReviewLineItem,
                              factorsById,
                            );
                            updateItem(item.id, patch);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {co2.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                      </TableCell>
                      <TableCell>
                        <ConfidenceDot level={item.confidence} />
                      </TableCell>
                    </TableRow>
                  );
                })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length} items
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

      <div className="sticky bottom-0 -mx-4 lg:-mx-8 mt-6 px-4 lg:px-8 py-4 bg-card border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isApproved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Approved and posted to emissions
            </span>
          ) : lowCount > 0 ? (
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {lowCount} items need attention before approval
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              All items look good
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canReview && (
            <>
              <Button
                variant="outline"
                disabled={saveReviewMutation.isPending || approveMutation.isPending}
                onClick={() => saveReviewMutation.mutate()}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveReviewMutation.isPending ? "Saving…" : dirty ? "Save review" : "Save review"}
              </Button>
              <Button
                disabled={approveMutation.isPending || saveReviewMutation.isPending || items.some((i) => !i.factorId)}
                onClick={() => approveMutation.mutate()}
              >
                <Send className="w-4 h-4 mr-2" />
                {approveMutation.isPending ? "Posting…" : "Approve & post"}
              </Button>
            </>
          )}
          {isApproved && (
            <Button onClick={() => setLocation("/emissions")}>
              View emissions
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

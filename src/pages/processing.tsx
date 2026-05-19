import { useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
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
import { useUpload } from "@/hooks/use-data";
import { generateExtractedItems, MOCK_FACTORS, type ConfidenceLevel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
  const { data: upload, isLoading } = useUpload(params.id);

  const initialItems = useMemo(() => generateExtractedItems(params.id), [params.id]);
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lowCount = items.filter((i) => i.confidence === "low").length;
  const highCount = items.filter((i) => i.confidence === "high").length;

  const updateItem = (id: string, patch: Partial<typeof items[number]>) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const totalEmissions = items.reduce((acc, i) => {
    const f = MOCK_FACTORS.find((x) => x.id === i.factorId);
    return acc + (f ? i.quantity * f.value : 0);
  }, 0);

  if (isLoading || !upload) {
    return (
      <>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-96" />
      </>
    );
  }

  return (
    <>
      <Link href="/uploads">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to uploads
        </Button>
      </Link>

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
              {(totalEmissions / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">tCO2e</span>
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
          <div className="text-sm">
            <div className="font-medium text-foreground">Extraction summary</div>
            <p className="text-muted-foreground mt-1 leading-snug">
              Vayura extracted {items.length} line items from this document. {lowCount} items have low confidence and need your review before they can be approved.
              You can edit any quantity, vendor, or emission factor below.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extracted line items</CardTitle>
          <CardDescription>Review, edit, and approve each row before posting to your emissions ledger.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Emission factor</TableHead>
                  <TableHead className="text-right">kgCO2e</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => {
                  const factor = MOCK_FACTORS.find((f) => f.id === item.factorId);
                  const co2 = factor ? item.quantity * factor.value : 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </TableCell>
                      <TableCell className="text-sm">{item.vendor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-24 text-right tabular-nums ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      <TableCell>
                        <Select value={item.factorId} onValueChange={(v) => updateItem(item.id, { factorId: v })}>
                          <SelectTrigger className="h-8 w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_FACTORS.map((f) => (
                              <SelectItem key={f.id} value={f.id} className="text-xs">
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {co2.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                      </TableCell>
                      <TableCell>
                        <ConfidenceDot level={item.confidence} />
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          {lowCount > 0 ? (
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
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" /> Save review
          </Button>
          <Button onClick={() => setLocation("/emissions")}>
            <Send className="w-4 h-4 mr-2" /> Approve & post
          </Button>
        </div>
      </div>
    </>
  );
}

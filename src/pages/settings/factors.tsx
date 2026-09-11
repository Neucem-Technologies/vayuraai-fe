import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Plus,
  History,
  Pencil,
  ExternalLink,
  RefreshCw,
  FileUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFactors } from "@/hooks/use-data";
import {
  createCustomEmissionFactor,
  importCustomEmissionFactors,
  parseEmissionFactorsFile,
  syncEmissionFactors,
  type CreateCustomEmissionFactorInput,
} from "@/lib/emission-factors-api";
import {
  isPdfFactorFile,
  isSpreadsheetFactorFile,
  parseSpreadsheetFactors,
} from "@/lib/factor-file-import";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { EmissionFactor } from "@/lib/mock-data";

const CATEGORIES = [
  "Electricity",
  "Fuel",
  "Business Travel",
  "Refrigerants",
  "Waste",
  "Water",
  "Materials",
  "Transportation",
  "Purchased Services",
  "Other",
];

const ACTIVITY_UNITS = ["kWh", "L", "km", "trip", "night", "meal", "kg", "tonne", "INR", "USD"];

export default function SettingsFactors() {
  const queryClient = useQueryClient();
  const { data: factors, isLoading } = useFactors();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "Scope 1" | "Scope 2" | "Scope 3">("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<EmissionFactor | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<CreateCustomEmissionFactorInput[]>([]);
  const [importParsing, setImportParsing] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [createCategory, setCreateCategory] = useState("Business Travel");
  const [createScope, setCreateScope] = useState<"Scope 1" | "Scope 2" | "Scope 3">("Scope 3");
  const [value, setValue] = useState("");
  const [activityUnit, setActivityUnit] = useState("km");
  const [region, setRegion] = useState("India");
  const [effectiveYear, setEffectiveYear] = useState(String(new Date().getFullYear()));
  const [validFrom, setValidFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [validTo, setValidTo] = useState(`${new Date().getFullYear()}-12-31`);

  const categories = useMemo(
    () => Array.from(new Set((factors ?? []).map((f) => f.category))),
    [factors],
  );

  const filtered = (factors ?? []).filter((f) => {
    if (scope !== "all" && f.scope !== scope) return false;
    if (category !== "all" && f.category !== category) return false;
    if (
      search &&
      !f.name.toLowerCase().includes(search.toLowerCase()) &&
      !f.source.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const resetCreateForm = () => {
    setName("");
    setCreateCategory("Business Travel");
    setCreateScope("Scope 3");
    setValue("");
    setActivityUnit("km");
    setRegion("India");
    setEffectiveYear(String(new Date().getFullYear()));
    setValidFrom(`${new Date().getFullYear()}-01-01`);
    setValidTo(`${new Date().getFullYear()}-12-31`);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCustomEmissionFactor({
        name,
        category: createCategory,
        scope: createScope,
        value: Number(value),
        activityUnit,
        region,
        effectiveYear: Number(effectiveYear),
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        validTo: validTo ? new Date(`${validTo}T23:59:59.999Z`).toISOString() : null,
      }),
    onSuccess: async (factor) => {
      await queryClient.invalidateQueries({ queryKey: ["factors"] });
      toast({ title: "Custom factor added", description: factor.name });
      resetCreateForm();
      setCreateOpen(false);
    },
    onError: (e) => {
      toast({
        title: "Could not add factor",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncEmissionFactors(),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["factors"] });
      toast({
        title: "Factor library refreshed",
        description: `${data.totalFactors} factors available from publisher packs.`,
      });
    },
    onError: (e) => {
      toast({
        title: "Sync failed",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const resetImport = () => {
    setImportFileName(null);
    setImportRows([]);
    setImportParsing(false);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportParsing(true);
    setImportFileName(file.name);
    setImportRows([]);
    try {
      if (isSpreadsheetFactorFile(file.name)) {
        const buffer = await file.arrayBuffer();
        const rows = parseSpreadsheetFactors(buffer);
        if (rows.length === 0) {
          throw new Error(
            "No valid rows found. Need columns: name, category, scope, value, activity_unit.",
          );
        }
        setImportRows(rows);
      } else if (isPdfFactorFile(file.name)) {
        const parsed = await parseEmissionFactorsFile(file);
        setImportRows(parsed.factors);
      } else {
        throw new Error("Unsupported file. Use CSV, Excel (.xlsx/.xls), or PDF.");
      }
    } catch (e) {
      setImportFileName(null);
      setImportRows([]);
      toast({
        title: "Could not read file",
        description: e instanceof ApiRequestError || e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setImportParsing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: () => importCustomEmissionFactors(importRows),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["factors"] });
      toast({
        title: "Factors imported",
        description:
          data.failed > 0
            ? `${data.imported} imported, ${data.failed} failed.`
            : `${data.imported} custom factors added.`,
      });
      resetImport();
      setImportOpen(false);
    },
    onError: (e) => {
      toast({
        title: "Import failed",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const canCreate =
    name.trim().length >= 2 &&
    Number(value) > 0 &&
    activityUnit.trim().length > 0 &&
    !createMutation.isPending;

  return (
    <>
      <PageHeader
        title="Emission factors library"
        subtitle="Region-specific factors used to convert activity data into kgCO2e. Sync publisher packs, add custom factors, or import from CSV, Excel, or PDF."
        actions={
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              data-testid="button-sync-factors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing…" : "Sync library"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              data-testid="button-import-factors"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Import file
            </Button>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-add-custom-factor">
              <Plus className="w-4 h-4 mr-2" />
              Add custom factor
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total factors", value: factors?.length ?? 0 },
          { label: "Scope 1", value: factors?.filter((f) => f.scope === "Scope 1").length ?? 0 },
          { label: "Scope 2", value: factors?.filter((f) => f.scope === "Scope 2").length ?? 0 },
          { label: "Scope 3", value: factors?.filter((f) => f.scope === "Scope 3").length ?? 0 },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4">
            <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Scope 1">Scope 1</TabsTrigger>
                <TabsTrigger value="Scope 2">Scope 2</TabsTrigger>
                <TabsTrigger value="Scope 3">Scope 3</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <div className="relative w-full xl:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search factors or sources..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full xl:w-48">
                <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factor</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  filtered.map((f) => (
                    <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelected(f)}>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{f.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                          {f.scope}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.category}</TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {f.value}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.unit}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.source}</TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {f.lastUpdated}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelected(f)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.source} • Valid {selected.lastUpdated}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="rounded-md border p-4 bg-primary/5 border-primary/20">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Current value
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight">{selected.value}</span>
                    <span className="text-sm text-muted-foreground">{selected.unit}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Scope", selected.scope],
                    ["Category", selected.category],
                    ["Source", selected.source],
                    ["Validity", selected.lastUpdated],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        {k}
                      </div>
                      <div className="text-sm text-foreground">{v}</div>
                    </div>
                  ))}
                </div>

                {selected.versions && selected.versions.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Version history
                    </div>
                    <div className="rounded-md border divide-y">
                      {selected.versions.map((v) => (
                        <div key={v.version} className="p-3 flex items-start justify-between text-sm">
                          <div>
                            <div className="font-medium text-foreground">
                              {v.version} — {v.value} {selected.unit}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{v.note}</div>
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {v.updated}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add related custom factor
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Publisher documentation
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add custom factor</DialogTitle>
            <DialogDescription>
              Create an organisation-managed factor with an explicit validity window. Use publisher
              Sync for CEA/DEFRA packs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Company EV fleet (India)"
                data-testid="input-custom-factor-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Scope</Label>
                <Select
                  value={createScope}
                  onValueChange={(v) => setCreateScope(v as typeof createScope)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scope 1">Scope 1</SelectItem>
                    <SelectItem value="Scope 2">Scope 2</SelectItem>
                    <SelectItem value="Scope 3">Scope 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Category</Label>
                <Select value={createCategory} onValueChange={setCreateCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Value (kgCO2e per unit)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  data-testid="input-custom-factor-value"
                />
              </div>
              <div>
                <Label className="text-sm">Activity unit</Label>
                <Select value={activityUnit} onValueChange={setActivityUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Region</Label>
                <Input className="mt-1" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">Effective year</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={effectiveYear}
                  onChange={(e) => setEffectiveYear(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Valid from</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Valid to</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canCreate}
              onClick={() => createMutation.mutate()}
              data-testid="button-confirm-custom-factor"
            >
              {createMutation.isPending ? "Saving…" : "Save factor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) resetImport();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import factors from file</DialogTitle>
            <DialogDescription>
              Upload CSV, Excel (.xlsx/.xls), or PDF. Required columns: name, category, scope,
              value, activity_unit. Optional: region, year, valid_from, valid_to.
            </DialogDescription>
          </DialogHeader>
          <input
            ref={importInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,.tsv,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => void handleImportFile(e.target.files?.[0])}
          />
          <div className="space-y-3 py-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              disabled={importParsing || importMutation.isPending}
              onClick={() => importInputRef.current?.click()}
              data-testid="button-choose-factor-file"
            >
              <FileUp className="w-4 h-4 mr-2" />
              {importParsing
                ? "Reading file…"
                : importFileName
                  ? `Chosen: ${importFileName}`
                  : "Choose CSV, Excel, or PDF"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Spreadsheets are parsed in the browser. PDFs are scanned for tabular factor rows —
              review the preview before importing.
            </p>
            {importRows.length > 0 && (
              <div className="rounded-md border overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.slice(0, 50).map((row, i) => (
                      <TableRow key={`${row.name}-${i}`}>
                        <TableCell className="text-sm font-medium">{row.name}</TableCell>
                        <TableCell className="text-sm">{row.scope}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.category}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{row.value}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.activityUnit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {importRows.length > 50 && (
              <p className="text-xs text-muted-foreground">
                Showing first 50 of {importRows.length} rows.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportOpen(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={importRows.length === 0 || importParsing || importMutation.isPending}
              onClick={() => importMutation.mutate()}
              data-testid="button-confirm-import-factors"
            >
              {importMutation.isPending
                ? "Importing…"
                : `Import ${importRows.length || ""} factor${importRows.length === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  History,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFactors } from "@/hooks/use-data";
import type { EmissionFactor } from "@/lib/mock-data";

export default function SettingsFactors() {
  const { data: factors, isLoading } = useFactors();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "Scope 1" | "Scope 2" | "Scope 3">("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<EmissionFactor | null>(null);

  const categories = useMemo(() => Array.from(new Set((factors ?? []).map((f) => f.category))), [factors]);

  const filtered = (factors ?? []).filter((f) => {
    if (scope !== "all" && f.scope !== scope) return false;
    if (category !== "all" && f.category !== category) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Emission factors library"
        subtitle="Region-specific factors used to convert your activity data into kgCO2e. Pinned to authoritative sources."
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add custom factor
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total factors", value: factors?.length ?? 0 },
          { label: "Scope 1", value: factors?.filter(f => f.scope === "Scope 1").length ?? 0 },
          { label: "Scope 2", value: factors?.filter(f => f.scope === "Scope 2").length ?? 0 },
          { label: "Scope 3", value: factors?.filter(f => f.scope === "Scope 3").length ?? 0 },
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
            <Tabs value={scope} onValueChange={(v) => setScope(v as any)}>
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
                  <SelectItem key={c} value={c}>{c}</SelectItem>
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
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && filtered.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelected(f)}>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{f.name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground font-medium">{f.scope}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.category}</TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">{f.value}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{f.lastUpdated}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(f)}>
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
                <SheetDescription>{selected.source} • Last updated {selected.lastUpdated}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="rounded-md border p-4 bg-primary/5 border-primary/20">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Current value</div>
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
                    ["Last updated", selected.lastUpdated],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">{k}</div>
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
                            <div className="font-medium text-foreground">{v.version} — {v.value} {selected.unit}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{v.note}</div>
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums shrink-0">{v.updated}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button>
                    <Pencil className="w-4 h-4 mr-2" />
                    Override for our organization
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View source documentation
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

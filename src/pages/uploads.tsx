import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  Upload as UploadIcon,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploads } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import type { UploadStatus } from "@/lib/mock-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPeriod(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  return `${new Date(startIso).toLocaleDateString("en-IN", opts)} - ${new Date(endIso).toLocaleDateString("en-IN", opts)}`;
}

const STATUS_TABS: ("all" | UploadStatus)[] = ["all", "Processing", "Needs Review", "Completed", "Failed"];

export default function Uploads() {
  const [, setLocation] = useLocation();
  const { data: uploads, isLoading } = useUploads();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | UploadStatus>("all");
  const [facility, setFacility] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const facilities = Array.from(new Set((uploads ?? []).map((u) => u.facility)));

  const UPLOAD_URGENCY: Record<UploadStatus, number> = {
    "Needs Review": 0,
    "Processing": 1,
    "Failed": 2,
    "Completed": 3,
  };

  const filtered = (uploads ?? [])
    .filter((u) => {
      if (tab !== "all" && u.status !== tab) return false;
      if (facility !== "all" && u.facility !== facility) return false;
      if (search && !u.filename.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const urgencyDiff = (UPLOAD_URGENCY[a.status] ?? 9) - (UPLOAD_URGENCY[b.status] ?? 9);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setStagedFiles(Array.from(files));
  };

  const counts = {
    all: uploads?.length ?? 0,
    Processing: uploads?.filter((u) => u.status === "Processing").length ?? 0,
    "Needs Review": uploads?.filter((u) => u.status === "Needs Review").length ?? 0,
    Completed: uploads?.filter((u) => u.status === "Completed").length ?? 0,
    Failed: uploads?.filter((u) => u.status === "Failed").length ?? 0,
  };

  return (
    <>
      <PageHeader
        title="Uploads"
        subtitle="Send invoices, statements, and exports to Vayura — we'll extract activity data and apply the right emission factors."
        actions={
          <Button onClick={() => inputRef.current?.click()}>
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload files
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.xlsx,.xls,.csv"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Card
        className={cn(
          "mb-6 transition-all border-dashed",
          isDragging ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <UploadIcon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-medium text-foreground">Drop files here or click to browse</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Supports PDF invoices, Excel spreadsheets, and CSV exports up to 25 MB
          </p>
          {stagedFiles.length > 0 && (
            <div className="mt-4 w-full max-w-md text-left">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {stagedFiles.length} file(s) ready to upload
              </div>
              <div className="space-y-1.5">
                {stagedFiles.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/40">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => { setStagedFiles([]); }}>
                  Start processing
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStagedFiles([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full lg:w-auto">
              <TabsList>
                {STATUS_TABS.map((s) => (
                  <TabsTrigger key={s} value={s} className="capitalize">
                    {s === "all" ? "All" : s}
                    <span className="ml-2 text-xs text-muted-foreground">{counts[s]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <div className="relative w-full lg:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search filenames..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All facilities" />
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
                  <TableHead className="w-[34%]">File</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Data period</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                      No uploads match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => setLocation(`/uploads/processing/${u.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          {u.type === "Excel" || u.type === "CSV"
                            ? <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                            : <FileText className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{u.filename}</div>
                          <div className="text-xs text-muted-foreground">{u.type} • {u.size}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.facility}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{formatPeriod(u.periodStart, u.periodEnd)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(u.date)}</TableCell>
                    <TableCell className="text-sm tabular-nums">{u.lineItemCount}</TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/uploads/processing/${u.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View extraction
                          </DropdownMenuItem>
                          <DropdownMenuItem><Download className="w-4 h-4 mr-2" /> Download original</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload as UploadIcon,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AddFacilityDialog } from "@/components/add-facility-dialog";
import { SpreadsheetPreview } from "@/components/spreadsheet-preview";
import { useUploads, useFacilities } from "@/hooks/use-data";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { fetchUploadContent, uploadDocuments } from "@/lib/uploads-api";
import { isSpreadsheetFile } from "@/lib/is-spreadsheet";
import { ORGANISATION_WIDE_FACILITY } from "@/lib/facilities";
import { ApiRequestError } from "@/lib/api-client";
import {
  dedupeFilesInBatch,
  findBlockingFilenameConflicts,
  findCompletedFilenameMatches,
} from "@/lib/upload-dedup";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UploadStatus } from "@/lib/mock-data";

const ADD_FACILITY_VALUE = "__add_facility__";

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
  const queryClient = useQueryClient();
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const { data: uploads, isLoading } = useUploads();
  const { data: orgFacilities = [] } = useFacilities();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | UploadStatus>("all");
  const [facility, setFacility] = useState<string>("all");
  const [uploadFacility, setUploadFacility] = useState(ORGANISATION_WIDE_FACILITY);
  const [addFacilityOpen, setAddFacilityOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [batchSkipped, setBatchSkipped] = useState<string[]>([]);
  const [completedWarnings, setCompletedWarnings] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ files: File[]; allowDuplicate: boolean } | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMime, setPreviewMime] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewUploadId, setPreviewUploadId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewMime("");
    setPreviewName("");
    setPreviewUploadId(null);
  };

  const openPreview = async (uploadId: string) => {
    if (!orgId) return;
    setPreviewLoadingId(uploadId);
    try {
      const content = await fetchUploadContent(orgId, uploadId);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(content.objectUrl);
      setPreviewBlob(content.blob);
      setPreviewMime(content.mimeType);
      setPreviewName(content.filename);
      setPreviewUploadId(uploadId);
      setPreviewOpen(true);
    } catch (e) {
      toast.error("Could not open original file", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const downloadOriginal = async (uploadId: string) => {
    if (!orgId) return;
    try {
      const content = await fetchUploadContent(orgId, uploadId, { download: true });
      const a = document.createElement("a");
      a.href = content.objectUrl;
      a.download = content.filename;
      a.click();
      URL.revokeObjectURL(content.objectUrl);
    } catch (e) {
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  const previewIsSpreadsheet = isSpreadsheetFile(previewMime, previewName);
  const previewIsImage = previewMime.startsWith("image/");
  const previewIsPdf = previewMime.includes("pdf");

  const uploadMutation = useMutation({
    mutationFn: ({ files, allowDuplicate, facilityLabel }: { files: File[]; allowDuplicate?: boolean; facilityLabel?: string }) => {
      if (!orgId) throw new Error("Select a client organisation before uploading.");
      return uploadDocuments(orgId, files, { allowDuplicate, facilityLabel });
    },
    onSuccess: async (created) => {
      setStagedFiles([]);
      setBatchSkipped([]);
      setCompletedWarnings([]);
      setUploadError(null);
      setConfirmOpen(false);
      setPendingUpload(null);
      await queryClient.invalidateQueries({ queryKey: ['uploads', orgId] });
      const first = created[0];
      if (first) setLocation(`/uploads/processing/${first.id}`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiRequestError && err.code === 'DUPLICATE_UPLOAD') {
        setConfirmOpen(true);
        setPendingUpload((prev) => prev ?? { files: stagedFiles, allowDuplicate: false });
        setUploadError(err.message);
        return;
      }
      setUploadError(err.message);
    },
  });

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
    const { files: unique, skipped } = dedupeFilesInBatch(Array.from(files));
    setStagedFiles(unique);
    setBatchSkipped(skipped);
    setUploadError(null);
    setCompletedWarnings(
      findCompletedFilenameMatches(
        unique,
        (uploads ?? []).map((u) => ({ filename: u.filename, status: u.status })),
      ),
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  const blockingConflicts = findBlockingFilenameConflicts(
    stagedFiles,
    (uploads ?? []).map((u) => ({ filename: u.filename, status: u.status })),
  );

  const startUpload = (allowDuplicate = false) => {
    if (stagedFiles.length === 0) return;
    setUploadError(null);
    setPendingUpload({ files: stagedFiles, allowDuplicate });
    if (blockingConflicts.length > 0 && !allowDuplicate) {
      setConfirmOpen(true);
      return;
    }
    uploadMutation.mutate({ files: stagedFiles, allowDuplicate, facilityLabel: uploadFacility });
  };

  const confirmUploadAnyway = () => {
    const payload = pendingUpload ?? { files: stagedFiles, allowDuplicate: true };
    uploadMutation.mutate({ files: payload.files, allowDuplicate: true, facilityLabel: uploadFacility });
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
        accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
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
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Supports PDF invoices, Excel/CSV spreadsheets, and images (JPG, PNG, WebP) up to 25 MB
          </p>
          {stagedFiles.length > 0 && (
              <div className="mt-4 w-full max-w-md text-left space-y-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Assign to facility</div>
                <Select
                  value={uploadFacility}
                  onValueChange={(value) => {
                    if (value === ADD_FACILITY_VALUE) {
                      if (!orgId) return;
                      setAddFacilityOpen(true);
                      return;
                    }
                    setUploadFacility(value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ORGANISATION_WIDE_FACILITY}>{ORGANISATION_WIDE_FACILITY}</SelectItem>
                    {orgFacilities.map((f) => (
                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                    ))}
                    {orgId && (
                      <SelectItem value={ADD_FACILITY_VALUE}>+ Add facility…</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  SaaS invoices (e.g. Cursor) default to organisation-wide unless you pick a site.
                </p>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {stagedFiles.length} file(s) ready to upload
              </div>
              {batchSkipped.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                  Skipped {batchSkipped.length} duplicate name{batchSkipped.length === 1 ? "" : "s"} in this batch.
                </p>
              )}
              {completedWarnings.length > 0 && (
                <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    {completedWarnings.length === 1
                      ? `"${completedWarnings[0]}" was uploaded before.`
                      : `${completedWarnings.length} files match names already completed.`}{" "}
                    Uploading again will create a separate record.
                  </span>
                </p>
              )}
              {blockingConflicts.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {blockingConflicts.length === 1
                      ? `"${blockingConflicts[0]}" is already processing.`
                      : `${blockingConflicts.length} files are already queued or processing.`}{" "}
                    You can confirm to upload anyway.
                  </span>
                </p>
              )}
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
                {stagedFiles.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    +{stagedFiles.length - 3} more file{stagedFiles.length - 3 === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              {uploadError && (
                <p className="mt-2 text-sm text-destructive">{uploadError}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  disabled={uploadMutation.isPending || !orgId}
                  onClick={() => startUpload(false)}
                >
                  {uploadMutation.isPending ? "Uploading…" : "Start processing"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={uploadMutation.isPending}
                  onClick={() => {
                    setStagedFiles([]);
                    setBatchSkipped([]);
                    setCompletedWarnings([]);
                    setUploadError(null);
                    setPendingUpload(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload duplicate filename?</AlertDialogTitle>
            <AlertDialogDescription>
              {blockingConflicts.length > 0 ? (
                <>
                  The following file{blockingConflicts.length === 1 ? "" : "s"} already exist
                  in the queue or are being processed:{" "}
                  <span className="font-medium text-foreground">
                    {blockingConflicts.join(", ")}
                  </span>
                  . Uploading again may create duplicate ingestion jobs.
                </>
              ) : (
                uploadError ?? "This filename is already being processed for this client."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploadMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={uploadMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmUploadAnyway();
              }}
            >
              Upload anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <TableHead className="w-[100px]" />
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
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview original"
                          disabled={previewLoadingId === u.id || !orgId}
                          onClick={() => void openPreview(u.id)}
                          data-testid={`button-preview-upload-${u.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
                            <DropdownMenuItem
                              disabled={previewLoadingId === u.id || !orgId}
                              onClick={() => void openPreview(u.id)}
                            >
                              <FileSpreadsheet className="w-4 h-4 mr-2" /> Preview original
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!orgId}
                              onClick={() => void downloadOriginal(u.id)}
                            >
                              <Download className="w-4 h-4 mr-2" /> Download original
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {orgId && (
        <AddFacilityDialog
          orgId={orgId}
          open={addFacilityOpen}
          onOpenChange={setAddFacilityOpen}
          onCreated={(facility) => setUploadFacility(facility.name)}
        />
      )}

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) closePreview();
          else setPreviewOpen(true);
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Original file</DialogTitle>
            <DialogDescription>{previewName}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-md border bg-muted/20 overflow-hidden">
            {previewUrl && previewIsImage && (
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-full max-w-full mx-auto object-contain"
              />
            )}
            {previewUrl && previewIsPdf && (
              <iframe title={previewName} src={previewUrl} className="w-full h-full border-0" />
            )}
            {previewBlob && previewIsSpreadsheet && (
              <SpreadsheetPreview blob={previewBlob} filename={previewName} />
            )}
            {previewUrl && !previewIsImage && !previewIsPdf && !previewIsSpreadsheet && (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Inline preview is available for PDF, images, Excel, and CSV. Download to open this
                  file locally.
                </p>
                <Button
                  size="sm"
                  disabled={!previewUploadId}
                  onClick={() => previewUploadId && void downloadOriginal(previewUploadId)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download original
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

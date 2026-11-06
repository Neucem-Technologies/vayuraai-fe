import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Leaf, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveClientStore } from "@/hooks/use-active-client";
import {
  attachOffsetEvidence,
  createOffset,
  deleteOffset,
  enquireOffsetProject,
  listOffsetProjects,
  listOffsets,
  updateOffset,
} from "@/lib/offsets-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { OffsetRecordDto, OffsetStatus } from "@vayura/api-contracts/offsets";

export default function Offsets() {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [enquireProjectId, setEnquireProjectId] = useState<string | null>(null);
  const [enquireMessage, setEnquireMessage] = useState("");

  const [projectName, setProjectName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [registry, setRegistry] = useState("");
  const [serial, setSerial] = useState("");
  const [vintage, setVintage] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const offsetsQuery = useQuery({
    queryKey: ["offsets", orgId],
    queryFn: () => listOffsets(orgId!),
    enabled: Boolean(orgId),
  });

  const projectsQuery = useQuery({
    queryKey: ["offset-projects"],
    queryFn: listOffsetProjects,
    enabled: Boolean(orgId),
  });

  const heldTotal = useMemo(
    () =>
      (offsetsQuery.data ?? [])
        .filter((o) => o.status === "held")
        .reduce((sum, o) => sum + o.quantityTco2e, 0),
    [offsetsQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      const offset = await createOffset(orgId, {
        projectName,
        quantityTco2e: Number(quantity),
        registry: registry || undefined,
        serial: serial || undefined,
        vintage: vintage || undefined,
        notes: notes || undefined,
      });
      if (evidenceFile) {
        await attachOffsetEvidence(orgId, offset.id, evidenceFile);
      }
      return offset;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offsets", orgId] });
      setAddOpen(false);
      setProjectName("");
      setQuantity("");
      setRegistry("");
      setSerial("");
      setVintage("");
      setNotes("");
      setEvidenceFile(null);
      toast({ title: "Offset recorded" });
    },
    onError: (e) => {
      toast({
        title: "Could not save offset",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OffsetStatus }) =>
      updateOffset(orgId!, id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offsets", orgId] });
      toast({ title: "Status updated" });
    },
    onError: (e) => {
      toast({
        title: "Could not update",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOffset(orgId!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offsets", orgId] });
      toast({ title: "Offset removed" });
    },
  });

  const enquireMutation = useMutation({
    mutationFn: () =>
      enquireOffsetProject(enquireProjectId!, {
        organisationId: orgId!,
        message: enquireMessage,
      }),
    onSuccess: () => {
      setEnquireProjectId(null);
      setEnquireMessage("");
      toast({
        title: "Enquiry sent",
        description: "This is an introduction request only. Vayura does not sell credits.",
      });
    },
    onError: (e) => {
      toast({
        title: "Could not send enquiry",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  if (!orgId) {
    return (
      <div className="p-6">
        <PageHeader title="Offsets" description="Select an organisation to manage offset records." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Offsets"
        description="Record internal offset holdings for this organisation. Offsets are not auto-netted off GHG, BRSR, GRI, or CBAM totals. Marking retired is self-declared and requires evidence — it is not third-party verification."
        actions={
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-offset">
            <Plus className="w-4 h-4 mr-1.5" />
            Record offset
          </Button>
        }
      />

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Held offsets are stored for your records only. Report PDFs stay on gross approved activity data until netting is added later.
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Held (tCO₂e)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{heldTotal.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Records</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {offsetsQuery.data?.length ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Your records</TabsTrigger>
          <TabsTrigger value="projects">Listed projects</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {offsetsQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (offsetsQuery.data?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Leaf className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p>No offset records yet.</p>
                  <Button className="mt-4" variant="outline" onClick={() => setAddOpen(true)}>
                    Record an offset
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Registry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead className="w-[200px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(offsetsQuery.data ?? []).map((row: OffsetRecordDto) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">{row.projectName}</div>
                          {row.vintage ? (
                            <div className="text-xs text-muted-foreground">Vintage {row.vintage}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="tabular-nums">{row.quantityTco2e} tCO₂e</TableCell>
                        <TableCell>{row.registry || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.hasEvidence ? row.evidenceOriginalFilename ?? "Attached" : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {row.status === "held" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!row.hasEvidence || statusMutation.isPending}
                              title={
                                row.hasEvidence
                                  ? "Mark as retired (self-declared; not third-party verified)"
                                  : "Attach evidence before marking retired"
                              }
                              onClick={() => statusMutation.mutate({ id: row.id, status: "retired" })}
                            >
                              Mark retired
                            </Button>
                          ) : null}
                          {row.status !== "void" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => statusMutation.mutate({ id: row.id, status: "void" })}
                            >
                              Void
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(row.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enquire for an introduction to the project developer. Neucem and Vayura do not sell carbon credits.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {projectsQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              (projectsQuery.data ?? []).map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <CardDescription>
                      {p.type}
                      {p.location ? ` · ${p.location}` : ""}
                      {p.registry ? ` · ${p.registry}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <p className="text-xs text-muted-foreground">Developer: {p.developer || "—"}</p>
                    <Button size="sm" onClick={() => setEnquireProjectId(p.id)}>
                      Enquire
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record an offset</DialogTitle>
            <DialogDescription>
              Add a held or retired credit for this organisation. Attach evidence if you have a certificate or invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Project / name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity (tCO₂e)</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label>Vintage</Label>
                <Input value={vintage} onChange={(e) => setVintage(e.target.value)} placeholder="2024" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Registry</Label>
                <Input value={registry} onChange={(e) => setRegistry(e.target.value)} />
              </div>
              <div>
                <Label>Serial</Label>
                <Input value={serial} onChange={(e) => setSerial(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Evidence (optional — PDF, PNG, or JPEG)</Label>
              <Input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required before you can mark a record as retired.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !projectName.trim() ||
                !Number.isFinite(Number(quantity)) ||
                Number(quantity) <= 0 ||
                createMutation.isPending
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(enquireProjectId)} onOpenChange={(o) => !o && setEnquireProjectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enquire about this project</DialogTitle>
            <DialogDescription>
              We will record your request so the team can introduce you. This is not a purchase.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={enquireMessage}
            onChange={(e) => setEnquireMessage(e.target.value)}
            rows={4}
            placeholder="Tell us what volume or vintage you are looking for..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnquireProjectId(null)}>
              Cancel
            </Button>
            <Button
              disabled={enquireMessage.trim().length < 10 || enquireMutation.isPending}
              onClick={() => enquireMutation.mutate()}
            >
              {enquireMutation.isPending ? "Sending..." : "Send enquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

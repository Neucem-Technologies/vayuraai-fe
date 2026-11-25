/**
 * Tally live pull. File import stays on Uploads.
 * Visible in the nav only when `permissions.canManageTenant`. This page still
 * refuses other roles, and the API is the real gate.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveClient } from "@/hooks/use-active-client";
import { useAuthStore } from "@/hooks/use-auth";
import { integrationErrorMessage, isIntegrationForbidden } from "@/lib/integration-errors";
import {
  listIntegrationConnections,
  listIntegrationRuns,
  pullTallyLive,
  saveTallyLiveConnection,
  testTallyConnection,
  type IntegrationConnection,
} from "@/lib/integrations-api";
import { invalidateOrgWorkspace } from "@/lib/query-invalidation";
import { readStoredReportingFy } from "@/lib/reporting-fy";
import { toast } from "sonner";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SettingsConnectors() {
  const activeClient = useActiveClient();
  const orgId = activeClient?.id ?? null;
  const canManage = useAuthStore((s) => s.access?.permissions.canManageTenant ?? false);
  const queryClient = useQueryClient();
  const fy = readStoredReportingFy();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("9000");
  const [companyName, setCompanyName] = useState("");
  const [includeJournals, setIncludeJournals] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [from, setFrom] = useState(fy.periodStart);
  const [to, setTo] = useState(fy.periodEnd);
  const [formError, setFormError] = useState<string | null>(null);
  const [pullNotice, setPullNotice] = useState<string | null>(null);
  const [pullUploadId, setPullUploadId] = useState<string | null>(null);
  const [appliedOrgId, setAppliedOrgId] = useState<string | null>(null);

  const connections = useQuery({
    queryKey: ["integrations", orgId, "connections"],
    queryFn: () => listIntegrationConnections(orgId!),
    enabled: !!orgId && canManage,
  });
  const runs = useQuery({
    queryKey: ["integrations", orgId, "runs"],
    queryFn: () => listIntegrationRuns(orgId!),
    enabled: !!orgId && canManage,
  });

  const live = connections.data?.find((row) => row.provider === "tally_live") ?? null;

  useEffect(() => {
    if (!orgId || !connections.isSuccess || appliedOrgId === orgId) return;
    setAppliedOrgId(orgId);
    setHost(live?.settings.host ?? "");
    setPort(String(live?.settings.port ?? 9000));
    setCompanyName(live?.settings.companyName ?? "");
    setIncludeJournals(Boolean(live?.settings.includeJournals));
    setEnabled(live ? live.status === "active" : true);
    setFormError(null);
    setPullNotice(null);
    setPullUploadId(null);
  }, [orgId, connections.isSuccess, appliedOrgId, live]);

  const dirty = !orgId || appliedOrgId !== orgId ? false : isDirty(live, { host, port, companyName, includeJournals, enabled });
  const windowError = dateWindowError(from, to);
  const configured = Boolean(live?.settings.host);
  const pullBlocked = !configured || dirty || !enabled || live?.status !== "active";

  const save = useMutation({
    mutationFn: () => {
      const parsedPort = Number(port);
      if (!host.trim()) throw new Error("Enter the Tally computer address.");
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        throw new Error("Enter a port between 1 and 65535.");
      }
      return saveTallyLiveConnection(orgId!, {
        status: enabled ? "active" : "disabled",
        includeJournals,
        host: host.trim(),
        port: parsedPort,
        companyName: companyName.trim(),
      });
    },
    onSuccess: (connection) => {
      setFormError(null);
      queryClient.setQueryData<IntegrationConnection[]>(["integrations", orgId, "connections"], (current) => {
        const rest = (current ?? []).filter((row) => row.provider !== "tally_live");
        return [...rest, connection];
      });
      toast.success(connection.settings.host ? "Tally address saved" : "Tally connection saved");
    },
    onError: (error) => setFormError(integrationErrorMessage(error, "Could not save the Tally address.")),
  });

  const test = useMutation({
    mutationFn: () => testTallyConnection(orgId!),
    onSuccess: (result) => {
      setFormError(null);
      const names = result.companies;
      if (names.length === 0) {
        toast.success("Tally responded", { description: "No company name was returned. Load the company in TallyPrime." });
        return;
      }
      const expected = (live?.settings.companyName ?? "").trim().toLowerCase();
      const listed = !expected || names.some((name) => name.trim().toLowerCase() === expected);
      toast.success("Tally responded", {
        description: listed ? names.join(", ") : `${names.join(", ")}. The saved company name is not in that list.`,
      });
    },
    onError: (error) => setFormError(integrationErrorMessage(error, "Could not reach Tally.")),
  });

  const pull = useMutation({
    mutationFn: () => pullTallyLive(orgId!, { from, to }),
    onSuccess: (result) => {
      setFormError(null);
      setPullNotice(result.message);
      setPullUploadId(result.uploadId);
      void queryClient.invalidateQueries({ queryKey: ["integrations", orgId, "runs"] });
      if (result.imported && result.uploadId) {
        invalidateOrgWorkspace(queryClient, orgId);
        toast.success("Tally pull queued", { description: result.message });
      } else {
        toast.message("Nothing imported", { description: result.message });
      }
    },
    onError: (error) => {
      setPullNotice(null);
      setFormError(integrationErrorMessage(error, "Could not pull data from Tally."));
    },
  });

  const liveRuns = (runs.data ?? []).filter((run) => run.connection?.provider === "tally_live");
  const forbidden = isIntegrationForbidden(connections.error) || isIntegrationForbidden(runs.error);

  if (!canManage || forbidden) {
    return (
      <div>
        <PageHeader title="Connectors" subtitle="Pull vouchers from TallyPrime." />
        <Card>
          <CardHeader>
            <CardTitle>Permission denied</CardTitle>
            <CardDescription>Only a firm admin can connect Tally or pull data.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connectors"
        subtitle="Pull purchase, expense, and stock lines from a running TallyPrime company. Lines stay in review until someone approves them."
      />

      {connections.isLoading || runs.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : connections.isError || runs.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load connectors</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{integrationErrorMessage(connections.error ?? runs.error, "Try again in a moment.")}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void connections.refetch();
                void runs.refetch();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {!configured ? (
            <Alert>
              <AlertTitle>Tally is not connected</AlertTitle>
              <AlertDescription>
                Enter the computer where TallyPrime is open. On that computer, set Connectivity to Client/Server,
                usually port 9000, and load the company. Excel and Tally file exports still go through Uploads.
              </AlertDescription>
            </Alert>
          ) : null}

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Tally</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>TallyPrime gateway</CardTitle>
              <CardDescription>
                Host and port only. Vayura does not ask for a Tally password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tally-host">Host</Label>
                  <Input
                    id="tally-host"
                    value={host}
                    placeholder="192.168.1.20"
                    autoComplete="off"
                    onChange={(event) => setHost(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tally-port">Port</Label>
                  <Input
                    id="tally-port"
                    inputMode="numeric"
                    value={port}
                    onChange={(event) => setPort(event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tally-company">Company name</Label>
                  <Input
                    id="tally-company"
                    value={companyName}
                    placeholder="Name of the company open in Tally"
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="tally-enabled">Connection enabled</Label>
                <Switch id="tally-enabled" checked={enabled} onCheckedChange={setEnabled} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="tally-journals">Include mapped journals</Label>
                  <p className="text-sm text-muted-foreground">Unmapped journals stay skipped.</p>
                </div>
                <Switch id="tally-journals" checked={includeJournals} onCheckedChange={setIncludeJournals} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
                  {save.isPending ? "Saving…" : "Save address"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => test.mutate()}
                  disabled={!configured || dirty || !enabled || test.isPending || pull.isPending}
                >
                  {test.isPending ? "Testing…" : "Test connection"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pull from Tally</CardTitle>
              <CardDescription>
                One financial year at a time. The ingestion worker (`npm run worker:ingestion`) processes the upload.
                Lines stay in review until someone approves them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!enabled || live?.status === "disabled" ? (
                <Alert>
                  <AlertTitle>Connection disabled</AlertTitle>
                  <AlertDescription>Turn the connection back on and save before pulling.</AlertDescription>
                </Alert>
              ) : null}
              {pullNotice ? (
                <Alert>
                  <AlertTitle>{pullUploadId ? "Pull queued" : "Nothing imported"}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{pullNotice}</p>
                    {pullUploadId ? (
                      <Link href={`/uploads/processing/${pullUploadId}`} className="underline underline-offset-2">
                        Open this upload
                      </Link>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tally-from">From</Label>
                  <Input id="tally-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tally-to">To</Label>
                  <Input id="tally-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                </div>
              </div>
              {windowError ? <p className="text-sm text-destructive">{windowError}</p> : null}
              <Button
                type="button"
                onClick={() => pull.mutate()}
                disabled={pullBlocked || pull.isPending || Boolean(windowError)}
              >
                {pull.isPending ? "Pulling…" : "Pull now"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent pulls</CardTitle>
              <CardDescription>Each pull is an import run. Open it in Uploads to approve or reject lines.</CardDescription>
            </CardHeader>
            <CardContent>
              {runs.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : liveRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Tally pulls yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lines</TableHead>
                      <TableHead>Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{formatWhen(run.createdAt)}</TableCell>
                        <TableCell>
                          {formatDay(run.windowStart)} – {formatDay(run.windowEnd)}
                        </TableCell>
                        <TableCell className="capitalize">{run.status.replace(/_/g, " ")}</TableCell>
                        <TableCell>{run.parsedCount}</TableCell>
                        <TableCell>
                          {run.documentUploadId ? (
                            <Link href={`/uploads/processing/${run.documentUploadId}`} className="underline underline-offset-2">
                              Open
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function dateWindowError(from: string, to: string): string | null {
  if (!from || !to) return "Choose a start and end date.";
  if (from > to) return "The start date must be on or before the end date.";
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Choose a start and end date.";
  const days = Math.round((end - start) / 86_400_000) + 1;
  if (days > 366) return "Pull one financial year at a time.";
  return null;
}

function isDirty(
  live: IntegrationConnection | null,
  form: { host: string; port: string; companyName: string; includeJournals: boolean; enabled: boolean },
): boolean {
  if (!live) return form.host.trim().length > 0 || form.companyName.trim().length > 0 || form.port !== "9000" || form.includeJournals || !form.enabled;
  return (
    form.host.trim() !== (live.settings.host ?? "") ||
    form.port !== String(live.settings.port ?? 9000) ||
    form.companyName.trim() !== (live.settings.companyName ?? "") ||
    form.includeJournals !== live.settings.includeJournals ||
    form.enabled !== (live.status === "active")
  );
}

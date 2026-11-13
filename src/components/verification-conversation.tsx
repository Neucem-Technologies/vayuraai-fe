import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, MessageSquare, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api-client";
import {
  closeVerificationThread,
  downloadVerificationReportPdf,
  getThreadReviewPack,
  getVerificationThread,
  postVerificationMessage,
  updateVerificationStatus,
  type VerificationEngagementStatus,
} from "@/lib/verifiers-api";

const ENGAGEMENT_STEPS: { id: VerificationEngagementStatus; label: string }[] = [
  { id: "open", label: "Requested" },
  { id: "under_review", label: "Under review" },
  { id: "queries_raised", label: "Queries" },
  { id: "closed", label: "Closed" },
];

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: VerificationEngagementStatus) {
  return ENGAGEMENT_STEPS.find((step) => step.id === status)?.label ?? status;
}

function stepIndex(status: VerificationEngagementStatus) {
  const idx = ENGAGEMENT_STEPS.findIndex((step) => step.id === status);
  return idx < 0 ? 0 : idx;
}

export function VerificationConversation({
  threadId,
  canClose,
  onBack,
}: {
  threadId: string;
  canClose: boolean;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const accessKind = useAuthStore((s) => s.access?.kind);
  const isVerifier = accessKind === "verifier";
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"evidence" | "discussion">("evidence");

  const thread = useQuery({
    queryKey: ["verification-thread", threadId],
    queryFn: () => getVerificationThread(threadId),
  });
  const pack = useQuery({
    queryKey: ["verification-review-pack", threadId],
    queryFn: () => getThreadReviewPack(threadId),
  });

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["verification-thread", threadId] }),
      queryClient.invalidateQueries({ queryKey: ["verification-review-pack", threadId] }),
      queryClient.invalidateQueries({ queryKey: ["verifier-desk"] }),
      queryClient.invalidateQueries({ queryKey: ["verifier-inbox"] }),
    ]);
  }

  const send = useMutation({
    mutationFn: () => postVerificationMessage(threadId, body.trim()),
    onSuccess: async () => {
      setBody("");
      setTab("discussion");
      await refreshAll();
    },
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Could not send the message.";
      toast({ title: "Comment not sent", description: message, variant: "destructive" });
    },
  });

  const close = useMutation({
    mutationFn: () => closeVerificationThread(threadId),
    onSuccess: async () => {
      await refreshAll();
      toast({ title: "Engagement closed" });
    },
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Could not close the engagement.";
      toast({ title: "Could not close", description: message, variant: "destructive" });
    },
  });

  const setStatus = useMutation({
    mutationFn: (status: VerificationEngagementStatus) => updateVerificationStatus(threadId, status),
    onSuccess: async () => {
      await refreshAll();
    },
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Could not update status.";
      toast({ title: "Status not updated", description: message, variant: "destructive" });
    },
  });

  const download = useMutation({
    mutationFn: (input: { reportId: string; filename: string }) =>
      downloadVerificationReportPdf(threadId, input.reportId, input.filename),
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Download failed.";
      toast({ title: "Could not download", description: message, variant: "destructive" });
    },
  });

  const data = thread.data;
  const closed = data?.thread.status === "closed";
  const evidence = pack.data;
  const currentStep = stepIndex(data?.thread.status ?? "open");

  function commentOn(label: string) {
    const prefix = `Re: ${label}\n`;
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${prefix}` : prefix));
    setTab("discussion");
  }

  return (
    <div className="flex flex-col h-full min-h-[32rem]" data-testid="verification-conversation">
      <div className="border-b px-4 py-3 space-y-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack} aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{data?.thread.subject ?? "Verification engagement"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {data
                ? `${data.thread.clientName} · ${data.thread.verifierName} · assurance review`
                : "Loading…"}
            </div>
          </div>
          {data && <Badge variant={closed ? "outline" : "secondary"}>{statusLabel(data.thread.status)}</Badge>}
          {canClose && data && !closed && (
            <Button variant="outline" size="sm" disabled={close.isPending} onClick={() => close.mutate()}>
              Close engagement
            </Button>
          )}
          {isVerifier && data && data.thread.status === "open" && (
            <Button
              size="sm"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("under_review")}
            >
              Start review
            </Button>
          )}
        </div>

        <ol className="flex flex-wrap gap-2 text-[11px]" aria-label="Engagement progress">
          {ENGAGEMENT_STEPS.map((step, index) => {
            const active = index <= currentStep;
            return (
              <li
                key={step.id}
                className={`rounded-full px-2.5 py-1 border ${
                  active ? "bg-primary/10 border-primary/30 text-foreground" : "text-muted-foreground"
                }`}
              >
                {index + 1}. {step.label}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex gap-2 border-b px-4 py-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "evidence" ? "secondary" : "ghost"}
          onClick={() => setTab("evidence")}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Evidence room
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "discussion" ? "secondary" : "ghost"}
          onClick={() => setTab("discussion")}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Comments
          {data?.messages.length ? ` (${data.messages.length})` : ""}
        </Button>
      </div>

      {tab === "evidence" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/15">
          <p className="text-sm text-muted-foreground max-w-3xl">
            Review the client’s source uploads and disclosure reports. Download PDFs where available, then leave
            comments on specific items. You cannot change inventory data — this workspace is read-only for assurance.
          </p>

          {pack.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading evidence…</p>
          ) : pack.isError ? (
            <p className="text-sm text-muted-foreground">Evidence could not be loaded for this engagement.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Source uploads
                </h3>
                {(evidence?.uploads.length ?? 0) === 0 ? (
                  <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                    No reviewed uploads are available for this client yet.
                  </div>
                ) : (
                  evidence!.uploads.map((upload) => (
                    <article key={upload.id} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="font-medium text-sm break-all">{upload.originalFilename}</div>
                      <div className="text-xs text-muted-foreground">
                        {upload.status}
                        {upload.facilityLabel ? ` · ${upload.facilityLabel}` : ""}
                        {upload.activityDateFrom
                          ? ` · ${upload.activityDateFrom}${
                              upload.activityDateTo && upload.activityDateTo !== upload.activityDateFrom
                                ? ` → ${upload.activityDateTo}`
                                : ""
                            }`
                          : ""}
                      </div>
                      {!closed && (
                        <Button type="button" variant="outline" size="sm" onClick={() => commentOn(`upload “${upload.originalFilename}”`)}>
                          Raise query
                        </Button>
                      )}
                    </article>
                  ))
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Disclosure reports
                </h3>
                {(evidence?.reports.length ?? 0) === 0 ? (
                  <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                    No final or submitted reports are available for this client yet.
                  </div>
                ) : (
                  evidence!.reports.map((report) => (
                    <article key={report.id} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="font-medium text-sm">{report.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.framework} · {report.status}
                        {report.periodStart && report.periodEnd
                          ? ` · ${report.periodStart} → ${report.periodEnd}`
                          : ""}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {report.hasPdf && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={download.isPending}
                            onClick={() =>
                              download.mutate({ reportId: report.id, filename: report.title })
                            }
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download PDF
                          </Button>
                        )}
                        {!closed && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => commentOn(`report “${report.title}” (${report.framework})`)}
                          >
                            Raise query
                          </Button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
            {thread.isError && <p className="text-sm text-muted-foreground">Discussion could not be loaded.</p>}
            {(data?.messages.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No comments yet. Use “Raise query” on evidence, or write a note below.
              </p>
            )}
            {data?.messages.map((message) => (
              <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.mine ? "bg-primary text-primary-foreground" : "bg-card border"
                  }`}
                >
                  <div
                    className={`text-[11px] mb-1 ${
                      message.mine ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {message.authorName} · {message.authorSide === "verifier" ? "Verifier" : "Firm"} ·{" "}
                    {when(message.createdAt)}
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            className="border-t p-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (body.trim()) send.mutate();
            }}
          >
            <Textarea
              value={body}
              rows={3}
              maxLength={4000}
              disabled={closed || send.isPending}
              placeholder={
                closed
                  ? "This engagement is closed."
                  : "Write a query or response. The other party is notified by email."
              }
              onChange={(event) => setBody(event.target.value)}
              data-testid="input-verification-reply"
            />
            <div className="flex justify-end gap-2">
              {isVerifier && data && !closed && data.thread.status !== "queries_raised" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate("queries_raised")}
                >
                  Mark queries raised
                </Button>
              )}
              <Button
                type="submit"
                disabled={closed || send.isPending || body.trim().length === 0}
                data-testid="button-send-reply"
              >
                {send.isPending ? "Sending…" : "Post comment"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

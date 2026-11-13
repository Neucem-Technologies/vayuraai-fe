import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api-client";
import {
  closeVerificationThread,
  getThreadReviewPack,
  getVerificationThread,
  postVerificationMessage,
} from "@/lib/verifiers-api";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [body, setBody] = useState("");
  const thread = useQuery({
    queryKey: ["verification-thread", threadId],
    queryFn: () => getVerificationThread(threadId),
  });
  const pack = useQuery({
    queryKey: ["verification-review-pack", threadId],
    queryFn: () => getThreadReviewPack(threadId),
  });

  const send = useMutation({
    mutationFn: () => postVerificationMessage(threadId, body.trim()),
    onSuccess: async () => {
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["verification-thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["verifier-desk"] });
      await queryClient.invalidateQueries({ queryKey: ["verifier-inbox"] });
    },
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Could not send the message.";
      toast({ title: "Message not sent", description: message, variant: "destructive" });
    },
  });

  const close = useMutation({
    mutationFn: () => closeVerificationThread(threadId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["verification-thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["verifier-desk"] });
      toast({ title: "Conversation closed" });
    },
    onError: (error) => {
      const message = error instanceof ApiRequestError ? error.message : "Could not close the conversation.";
      toast({ title: "Could not close", description: message, variant: "destructive" });
    },
  });

  const data = thread.data;
  const closed = data?.thread.status === "closed";
  const evidence = pack.data;

  function commentOn(label: string) {
    const prefix = `Re: ${label}\n`;
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${prefix}` : prefix));
  }

  return (
    <div className="flex flex-col h-full min-h-[28rem]" data-testid="verification-conversation">
      <div className="flex items-start gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{data?.thread.subject ?? "Conversation"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {data ? `${data.thread.clientName} · ${data.thread.verifierName}` : "Loading…"}
          </div>
        </div>
        {data && (
          <Badge variant={closed ? "outline" : "secondary"}>{closed ? "Closed" : "Open"}</Badge>
        )}
        {canClose && data && !closed && (
          <Button variant="outline" size="sm" disabled={close.isPending} onClick={() => close.mutate()}>
            Close
          </Button>
        )}
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col min-h-0 border-r">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
            {thread.isError && <p className="text-sm text-muted-foreground">This conversation could not be loaded.</p>}
            {data?.messages.map((message) => (
              <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.mine ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                  <div className={`text-[11px] mb-1 ${message.mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {message.authorName} · {message.authorSide === "verifier" ? "Verifier" : "Consultant"} · {when(message.createdAt)}
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
                  ? "This conversation is closed."
                  : "Comment on an upload or report, or reply to the firm. The other side gets an email."
              }
              onChange={(event) => setBody(event.target.value)}
              data-testid="input-verification-reply"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={closed || send.isPending || body.trim().length === 0} data-testid="button-send-reply">
                {send.isPending ? "Sending…" : "Send comment"}
              </Button>
            </div>
          </form>
        </div>

        <aside className="overflow-y-auto p-3 space-y-4 bg-background">
          <div>
            <h3 className="text-sm font-medium">Evidence for review</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Uploads and reports for this client. Use “Comment” to discuss an item in the thread.
            </p>
          </div>

          {pack.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading evidence…</p>
          ) : pack.isError ? (
            <p className="text-xs text-muted-foreground">Evidence could not be loaded.</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uploads</div>
                {(evidence?.uploads.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">No reviewed uploads for this client yet.</p>
                ) : (
                  evidence!.uploads.map((upload) => (
                    <div key={upload.id} className="rounded-md border p-2 space-y-1">
                      <div className="flex items-start gap-2">
                        <Upload className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{upload.originalFilename}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {upload.status}
                            {upload.facilityLabel ? ` · ${upload.facilityLabel}` : ""}
                          </div>
                        </div>
                      </div>
                      {!closed && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => commentOn(`upload “${upload.originalFilename}”`)}
                        >
                          Comment
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reports</div>
                {(evidence?.reports.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">No final reports for this client yet.</p>
                ) : (
                  evidence!.reports.map((report) => (
                    <div key={report.id} className="rounded-md border p-2 space-y-1">
                      <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{report.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {report.framework} · {report.status}
                            {report.periodStart && report.periodEnd
                              ? ` · ${report.periodStart} → ${report.periodEnd}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      {!closed && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => commentOn(`report “${report.title}” (${report.framework})`)}
                        >
                          Comment
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

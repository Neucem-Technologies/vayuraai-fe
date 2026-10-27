import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api-client";
import {
  closeVerificationThread,
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
          placeholder={closed ? "This conversation is closed." : "Write a reply. The other side receives an email."}
          onChange={(event) => setBody(event.target.value)}
          data-testid="input-verification-reply"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={closed || send.isPending || body.trim().length === 0} data-testid="button-send-reply">
            {send.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}

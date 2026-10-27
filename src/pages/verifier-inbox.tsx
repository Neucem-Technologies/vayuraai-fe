import { useState } from "react";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { VerificationConversation } from "@/components/verification-conversation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listVerifierInbox } from "@/lib/verifiers-api";

export default function VerifierInbox() {
  const search = useSearch();
  const initialThread = new URLSearchParams(search).get("thread");
  const [threadId, setThreadId] = useState<string | null>(initialThread);
  const inbox = useQuery({ queryKey: ["verifier-inbox"], queryFn: listVerifierInbox });

  return (
    <div data-testid="page-verifier-inbox">
      <PageHeader
        title="Verification requests"
        subtitle={inbox.data ? `${inbox.data.organisationName} · reply here. The consulting firm gets an email.` : "Requests from consulting firms you work with."}
      />
      <Card className="min-h-[32rem] overflow-hidden">
        {threadId ? (
          <VerificationConversation threadId={threadId} canClose={false} onBack={() => setThreadId(null)} />
        ) : inbox.isLoading ? (
          <CardContent className="p-4">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        ) : inbox.isError ? (
          <CardContent className="py-8 text-sm text-muted-foreground">
            Requests could not be loaded.{" "}
            <button type="button" className="underline" onClick={() => inbox.refetch()}>Try again</button>
          </CardContent>
        ) : (inbox.data?.threads.length ?? 0) === 0 ? (
          <CardContent className="py-10 text-sm text-muted-foreground">
            No requests yet. When a consultant asks you to review a client, it will show up here and in your email.
          </CardContent>
        ) : (
          <div className="divide-y">
            {inbox.data?.threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className="w-full text-left px-4 py-4 hover:bg-muted"
                onClick={() => setThreadId(thread.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{thread.subject}</span>
                  <Badge variant={thread.status === "open" ? "secondary" : "outline"} className="ml-auto">
                    {thread.status === "open" ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Client · {thread.clientName}</div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{thread.lastMessage}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

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
        subtitle={
          inbox.data
            ? `${inbox.data.organisationName} · evidence room for uploads & reports, then comments. The firm gets an email.`
            : "Open an engagement to review evidence and leave assurance comments."
        }
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
            No requests yet. When a firm asks you to review a client’s uploads and reports, it will show up here (and in your email).
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
                  <Badge variant={thread.status === "closed" ? "outline" : "secondary"} className="ml-auto">
                    {thread.status === "closed"
                      ? "Closed"
                      : thread.status === "queries_raised"
                        ? "Queries"
                        : thread.status === "under_review"
                          ? "Under review"
                          : "Requested"}
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

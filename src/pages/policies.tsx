import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Scale } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useIsConsultantAdmin } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api-client";
import {
  createSuggestion,
  listPolicies,
  listSuggestions,
  refreshPolicies,
  reviewSuggestion,
  type LibrarySuggestion,
  type PolicyUpdate,
  type SuggestionStatus,
  type SuggestionTarget,
} from "@/lib/policies-api";

const JURISDICTIONS = ["All", "India", "European Union", "Global"] as const;

const TARGET_LABEL: Record<SuggestionTarget, string> = {
  policy: "Policy brief",
  factor_library: "Factor library",
};

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  submitted: "Sent",
  in_review: "In review",
  accepted: "Accepted",
  declined: "Declined",
};

function formatDay(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatChecked(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "Something went wrong. Try again.";
}

export default function Policies() {
  const queryClient = useQueryClient();
  const isAdmin = useIsConsultantAdmin();
  const [jurisdiction, setJurisdiction] = useState<(typeof JURISDICTIONS)[number]>("All");
  const [target, setTarget] = useState<SuggestionTarget>("policy");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const policiesQuery = useQuery({
    queryKey: ["policies"],
    queryFn: listPolicies,
  });
  const suggestionsQuery = useQuery({
    queryKey: ["policy-suggestions"],
    queryFn: listSuggestions,
  });

  const refresh = useMutation({
    mutationFn: refreshPolicies,
    onSuccess: (data) => {
      queryClient.setQueryData(["policies"], data);
      toast({ title: "Policy brief updated" });
    },
    onError: (error) => toast({ title: "Could not refresh", description: errorMessage(error), variant: "destructive" }),
  });

  const suggest = useMutation({
    mutationFn: createSuggestion,
    onSuccess: async () => {
      setTitle("");
      setDetails("");
      await queryClient.invalidateQueries({ queryKey: ["policy-suggestions"] });
      toast({ title: "Suggestion sent", description: "Your firm can review it from this page." });
    },
    onError: (error) => toast({ title: "Could not send suggestion", description: errorMessage(error), variant: "destructive" }),
  });

  const review = useMutation({
    mutationFn: ({ id, ...input }: { id: string; status: SuggestionStatus; reviewNote?: string }) =>
      reviewSuggestion(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["policy-suggestions"] });
    },
    onError: (error) => toast({ title: "Could not update suggestion", description: errorMessage(error), variant: "destructive" }),
  });

  const items = policiesQuery.data?.items ?? [];
  const visible = useMemo(
    () => (jurisdiction === "All" ? items : items.filter((item) => item.jurisdiction === jurisdiction)),
    [items, jurisdiction],
  );

  return (
    <div data-testid="page-policies">
      <PageHeader
        title="Policy"
        subtitle="Latest changes that affect how you measure and report emissions, plus a place to ask for an update."
        actions={
          <Button
            variant="outline"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending || policiesQuery.isLoading}
            data-testid="button-refresh-policies"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refresh.isPending ? "animate-spin" : ""}`} />
            Refresh brief
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground -mt-2 mb-6">
        This is Vayura’s brief, with a link to each official source.
        {policiesQuery.data?.checkedAt ? ` Last checked ${formatChecked(policiesQuery.data.checkedAt)}.` : ""}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="min-w-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {JURISDICTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={jurisdiction === option ? "default" : "outline"}
                onClick={() => setJurisdiction(option)}
                data-testid={`filter-${option.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {option}
              </Button>
            ))}
          </div>

          {policiesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : policiesQuery.isError ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                The policy brief could not be loaded.{" "}
                <button className="underline" type="button" onClick={() => policiesQuery.refetch()}>
                  Try again
                </button>
              </CardContent>
            </Card>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                Nothing in this jurisdiction yet. Choose All to see the full brief.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => (
                <PolicyCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Suggest a change</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask for a policy we should cover, or a factor the library is missing. Your firm administrator reviews it here.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-target">This is about</Label>
                <Select value={target} onValueChange={(value) => setTarget(value as SuggestionTarget)}>
                  <SelectTrigger id="suggestion-target" data-testid="select-suggestion-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy brief</SelectItem>
                    <SelectItem value="factor_library">Factor library</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-title">Title</Label>
                <Input
                  id="suggestion-title"
                  value={title}
                  maxLength={140}
                  placeholder="Add a cement factor for FY 2025-26"
                  onChange={(event) => setTitle(event.target.value)}
                  data-testid="input-suggestion-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-details">What should we look at?</Label>
                <Textarea
                  id="suggestion-details"
                  value={details}
                  maxLength={2000}
                  rows={5}
                  placeholder="Name the source, the year, and why the client needs it."
                  onChange={(event) => setDetails(event.target.value)}
                  data-testid="input-suggestion-details"
                />
              </div>
              <Button
                className="w-full"
                disabled={suggest.isPending || title.trim().length < 3 || details.trim().length < 10}
                onClick={() => suggest.mutate({ target, title: title.trim(), details: details.trim() })}
                data-testid="button-send-suggestion"
              >
                {suggest.isPending ? "Sending…" : "Send suggestion"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your firm’s suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestionsQuery.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : suggestionsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Suggestions could not be loaded.{" "}
                  <button className="underline" type="button" onClick={() => suggestionsQuery.refetch()}>
                    Try again
                  </button>
                </p>
              ) : (suggestionsQuery.data?.suggestions.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No suggestions yet. A short note is enough to start one.</p>
              ) : (
                suggestionsQuery.data?.suggestions.map((suggestion) => (
                  <SuggestionRow
                    key={suggestion.id}
                    suggestion={suggestion}
                    canReview={isAdmin}
                    pending={review.isPending}
                    onReview={(input) => review.mutate({ id: suggestion.id, ...input })}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PolicyCard({ item }: { item: PolicyUpdate }) {
  return (
    <Card data-testid={`policy-${item.slug}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline">{item.jurisdiction}</Badge>
          <Badge variant="secondary">{item.topic}</Badge>
          <Badge variant={item.stage === "In progress" ? "outline" : "default"}>{item.stage}</Badge>
          <span className="text-xs text-muted-foreground ml-auto">{formatDay(item.publishedOn)}</span>
        </div>
        <CardTitle className="text-base flex items-start gap-2">
          <Scale className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-foreground/90">{item.summary}</p>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">What this means. </span>
          {item.implication}
        </p>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {item.sourceName}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}

function SuggestionRow({
  suggestion,
  canReview,
  pending,
  onReview,
}: {
  suggestion: LibrarySuggestion;
  canReview: boolean;
  pending: boolean;
  onReview: (input: { status: SuggestionStatus; reviewNote?: string }) => void;
}) {
  const [note, setNote] = useState(suggestion.reviewNote);
  useEffect(() => {
    setNote(suggestion.reviewNote);
  }, [suggestion.reviewNote, suggestion.status]);

  return (
    <div className="rounded-md border p-3 space-y-2" data-testid={`suggestion-${suggestion.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{TARGET_LABEL[suggestion.target]}</Badge>
        <Badge variant={suggestion.status === "accepted" ? "default" : "secondary"}>
          {STATUS_LABEL[suggestion.status]}
        </Badge>
      </div>
      <p className="text-sm font-medium">{suggestion.title}</p>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.details}</p>
      <p className="text-xs text-muted-foreground">
        {suggestion.authorName} · {formatChecked(suggestion.createdAt)}
      </p>
      {canReview ? (
        <div className="space-y-2 pt-1">
          <Select
            value={suggestion.status}
            onValueChange={(value) => onReview({ status: value as SuggestionStatus, reviewNote: note })}
            disabled={pending}
          >
            <SelectTrigger data-testid={`select-status-${suggestion.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Sent</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={note}
            rows={2}
            maxLength={1000}
            placeholder="Note for the person who sent this"
            onChange={(event) => setNote(event.target.value)}
            data-testid={`input-note-${suggestion.id}`}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || note.trim() === suggestion.reviewNote}
            onClick={() => onReview({ status: suggestion.status, reviewNote: note.trim() })}
          >
            Save note
          </Button>
        </div>
      ) : suggestion.reviewNote ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Review note. </span>
          {suggestion.reviewNote}
        </p>
      ) : null}
    </div>
  );
}

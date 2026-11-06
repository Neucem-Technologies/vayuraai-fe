import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Briefcase, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { enquireConsultant, listListedConsultants } from "@/lib/consultants-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

export default function FindConsultants() {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const [search, setSearch] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const query = useQuery({
    queryKey: ["listed-consultants"],
    queryFn: listListedConsultants,
  });

  const filtered = (query.data ?? []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.primaryService ?? "").toLowerCase().includes(q) ||
      (c.listingBio ?? "").toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  const enquireMutation = useMutation({
    mutationFn: () =>
      enquireConsultant(targetId!, {
        message,
        organisationId: orgId ?? undefined,
      }),
    onSuccess: () => {
      setTargetId(null);
      setMessage("");
      toast({
        title: "Enquiry sent",
        description: "The firm can follow up. This does not move your organisation to their portfolio.",
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

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Find a consultant"
        description="Browse firms listed on Vayura. Listing is free. An enquiry is an introduction request only."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, service, or region"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {query.isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No listed consultants match your search yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.displayName}</CardTitle>
                <CardDescription>
                  {c.primaryService || "Sustainability consulting"}
                  {c.country ? ` · ${c.country}` : ""}
                  {c.entityType ? ` · ${c.entityType}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {c.listingBio || "This firm is listed on Vayura for early-access introductions."}
                </p>
                {c.website ? (
                  <a
                    href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {c.website}
                  </a>
                ) : null}
                <div>
                  <Button size="sm" onClick={() => setTargetId(c.id)}>
                    Enquire
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(targetId)} onOpenChange={(o) => !o && setTargetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enquire to this firm</DialogTitle>
            <DialogDescription>
              Share what you need help with. The firm decides whether to take you on as a client.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="We need help preparing BRSR / GHG inventory for FY..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetId(null)}>
              Cancel
            </Button>
            <Button
              disabled={message.trim().length < 10 || enquireMutation.isPending}
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

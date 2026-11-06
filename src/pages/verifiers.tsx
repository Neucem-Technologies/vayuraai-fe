import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { VerificationConversation } from "@/components/verification-conversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuthStore, useIsConsultantAdmin, useIsSmeWorkspace } from "@/hooks/use-auth";
import { useClients } from "@/hooks/use-data";
import { useActiveClientStore } from "@/hooks/use-active-client";
import { toast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api-client";
import {
  cancelVerifierInvite,
  inviteVerifier,
  listVerifierDesk,
  openVerificationThread,
} from "@/lib/verifiers-api";

function errorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : "Something went wrong. Try again.";
}

export default function Verifiers() {
  const search = useSearch();
  const initialThread = new URLSearchParams(search).get("thread");
  const isAdmin = useIsConsultantAdmin();
  const tenant = useAuthStore((s) => s.tenant);
  const isSme = useIsSmeWorkspace();
  const queryClient = useQueryClient();
  const clients = useClients();
  const activeClientId = useActiveClientStore((s) => s.activeClientId);
  const desk = useQuery({ queryKey: ["verifier-desk"], queryFn: listVerifierDesk });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(initialThread);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [orgId, setOrgId] = useState(activeClientId ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const verifiers = desk.data?.verifiers ?? [];
  const selected = verifiers.find((item) => item.id === selectedId) ?? verifiers[0] ?? null;
  const threads = useMemo(
    () => (desk.data?.threads ?? []).filter((thread) => !selected || thread.verifierOrgId === selected.id),
    [desk.data?.threads, selected],
  );

  const invite = useMutation({
    mutationFn: () => inviteVerifier({ name, contactName, email, note: note.trim() || undefined }),
    onSuccess: (data) => {
      const link = `${window.location.origin}/accept-verifier-invite?token=${encodeURIComponent(data.inviteToken)}`;
      setInviteLink(data.emailSent ? null : link);
      setName("");
      setContactName("");
      setEmail("");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["verifier-desk"] });
      toast({
        title: data.emailSent ? "Invite emailed" : "Invite created",
        description: data.emailSent
          ? "They will receive a link to set a password."
          : "Email is not configured. Share the invite link below.",
      });
    },
    onError: (error) => toast({ title: "Could not invite", description: errorMessage(error), variant: "destructive" }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelVerifierInvite(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["verifier-desk"] });
      toast({ title: "Invite cancelled" });
    },
    onError: (error) => toast({ title: "Could not cancel", description: errorMessage(error), variant: "destructive" }),
  });

  const request = useMutation({
    mutationFn: () =>
      openVerificationThread({
        verifierOrgId: selected!.id,
        orgId,
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: async (data) => {
      setRequestOpen(false);
      setSubject("");
      setMessage("");
      setThreadId(data.threadId);
      await queryClient.invalidateQueries({ queryKey: ["verifier-desk"] });
      toast({ title: "Request sent", description: "The verifier receives an email with a link to this conversation." });
    },
    onError: (error) => toast({ title: "Could not open request", description: errorMessage(error), variant: "destructive" }),
  });

  return (
    <div data-testid="page-verifiers">
      <PageHeader
        title="Verifiers"
        subtitle={
          isSme
            ? "When your inventory and reports are ready, invite a third-party verification agency to review them on Vayura."
            : "Onboard an assurance firm, then keep the review on the platform."
        }
        actions={
          isAdmin ? (
            <Button onClick={() => { setInviteLink(null); setInviteOpen(true); }} data-testid="button-invite-verifier">
              Invite verifier
            </Button>
          ) : null
        }
      />

      {desk.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : desk.isError ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Verifiers could not be loaded.{" "}
            <button type="button" className="underline" onClick={() => desk.refetch()}>Try again</button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <Card>
            <CardContent className="p-2">
              {verifiers.length === 0 ? (
                <div className="px-3 py-8 text-sm text-muted-foreground">
                  No verifiers yet. Invite the firm you want to review a client’s inventory.
                </div>
              ) : (
                verifiers.map((verifier) => (
                  <button
                    key={verifier.id}
                    type="button"
                    onClick={() => { setSelectedId(verifier.id); setThreadId(null); }}
                    className={`w-full text-left rounded-md px-3 py-3 ${
                      selected?.id === verifier.id ? "bg-sidebar-accent" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-sm truncate">{verifier.name}</span>
                      <Badge variant={verifier.status === "active" ? "default" : "outline"} className="ml-auto">
                        {verifier.status === "active" ? "Active" : "Invited"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {verifier.contactName} · {verifier.contactEmail}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[32rem] overflow-hidden">
            {threadId ? (
              <VerificationConversation threadId={threadId} canClose onBack={() => setThreadId(null)} />
            ) : (
              <CardContent className="p-4 space-y-4">
                {selected ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-medium">{selected.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selected.status === "active"
                            ? "They can sign in and reply to requests."
                            : "Waiting for them to set a password from the invite email."}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isAdmin && selected.pendingInviteId && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancel.isPending}
                            onClick={() => cancel.mutate(selected.pendingInviteId!)}
                          >
                            Cancel invite
                          </Button>
                        )}
                        <Button
                          size="sm"
                          disabled={selected.status !== "active"}
                          onClick={() => {
                            setOrgId(activeClientId ?? clients.data?.[0]?.id ?? "");
                            setRequestOpen(true);
                          }}
                        >
                          Request verification
                        </Button>
                      </div>
                    </div>
                    {threads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No conversations with this verifier yet.</p>
                    ) : (
                      <div className="divide-y rounded-md border">
                        {threads.map((thread) => (
                          <button
                            key={thread.id}
                            type="button"
                            className="w-full text-left px-3 py-3 hover:bg-muted"
                            onClick={() => setThreadId(thread.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{thread.subject}</span>
                              <Badge variant="outline" className="ml-auto">{thread.status === "open" ? "Open" : "Closed"}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {thread.clientName} · {thread.lastMessage || "No message yet"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Invite a verifier to start.</p>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a verifier</DialogTitle>
            <DialogDescription>
              Use the assurance firm’s name and the person who will sign in. The same steps work for any verifier you work with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="verifier-name">Organisation</Label>
              <Input id="verifier-name" value={name} placeholder="VKU Veridicriton" onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verifier-contact">Contact name</Label>
              <Input id="verifier-contact" value={contactName} onChange={(event) => setContactName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verifier-email">Work email</Label>
              <Input id="verifier-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verifier-note">Note in the email</Label>
              <Textarea id="verifier-note" rows={3} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
            </div>
            {inviteLink && (
              <p className="text-xs break-all text-muted-foreground">
                Share this link: {inviteLink}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              disabled={invite.isPending || name.trim().length < 2 || contactName.trim().length < 2 || !email.includes("@")}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request verification</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.name} receives this as the first message, plus an email.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients.data ?? []).map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="request-subject">Subject</Label>
              <Input id="request-subject" value={subject} placeholder="FY 2024-25 inventory review" onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="request-message">Message</Label>
              <Textarea id="request-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={request.isPending || !orgId || subject.trim().length < 3 || message.trim().length < 1}
              onClick={() => request.mutate()}
            >
              {request.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

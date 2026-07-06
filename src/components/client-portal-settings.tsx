import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useIsConsultantAdmin } from "@/hooks/use-auth";
import { updateOrganisation } from "@/lib/organisations-api";
import { inviteClientViewer, listClientViewers, revokeClientViewer } from "@/lib/consultant-api";
import { ApiRequestError } from "@/lib/api-client";
import type { OrganisationDto } from "@/lib/organisations-api";

type Props = {
  org: OrganisationDto;
  canEnablePortal: boolean;
};

export function ClientPortalSettings({ org, canEnablePortal }: Props) {
  const isAdmin = useIsConsultantAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const { data: viewers = [] } = useQuery({
    queryKey: ["client-viewers", org.id],
    queryFn: () => listClientViewers(org.id),
    enabled: isAdmin && org.clientViewerEnabled,
  });

  const togglePortal = useMutation({
    mutationFn: (enabled: boolean) =>
      updateOrganisation(org.id, { clientViewerEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", org.id] });
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Could not update portal",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const invite = useMutation({
    mutationFn: () => inviteClientViewer(org.id, email, fullName),
    onSuccess: (data) => {
      setLastInviteLink(
        `${window.location.origin}${import.meta.env.BASE_URL ?? "/"}accept-client-invite?token=${encodeURIComponent(data.inviteToken)}`,
      );
      setEmail("");
      setFullName("");
      queryClient.invalidateQueries({ queryKey: ["client-viewers", org.id] });
      toast({ title: "Invite created", description: "Share the invite link with your client (email delivery coming soon)." });
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => revokeClientViewer(org.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-viewers", org.id] });
      toast({ title: "Access revoked" });
    },
  });

  if (!isAdmin) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Client portal</CardTitle>
        <CardDescription>
          Read-only access for {org.shortName} to view emissions summaries and download reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canEnablePortal ? (
          <p className="text-sm text-muted-foreground">
            Upgrade to Growth or Enterprise to enable the client viewer portal for this organisation.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="portal-enabled" className="text-sm">
                Enable client portal for this organisation
              </Label>
              <Switch
                id="portal-enabled"
                checked={org.clientViewerEnabled}
                onCheckedChange={(v) => togglePortal.mutate(v)}
                disabled={togglePortal.isPending}
              />
            </div>
            {org.clientViewerEnabled && (
              <>
                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <Label className="text-sm">Client email</Label>
                    <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Full name</Label>
                    <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!email || !fullName || invite.isPending}
                  onClick={() => invite.mutate()}
                >
                  Invite client viewer
                </Button>
                {lastInviteLink && (
                  <p className="text-xs text-muted-foreground break-all">
                    Invite link (dev): {lastInviteLink}
                  </p>
                )}
                {viewers.length > 0 && (
                  <ul className="text-sm space-y-2 pt-2 border-t">
                    {viewers.map((v) => (
                      <li key={v.userId} className="flex justify-between items-center gap-2">
                        <span>
                          {v.fullName ?? v.email} · {v.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => revoke.mutate(v.userId)}
                        >
                          Revoke
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MoreHorizontal, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  tenantMemberRoleLabel,
  useAuthStore,
  useIsConsultantAdmin,
  useIsSmeWorkspace,
  useTenant,
} from "@/hooks/use-auth";
import { inviteTeamMember, listTeamMembers, removeTeamMember, updateTeamMemberRole } from "@/lib/team-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "sonner";
import type { TenantRole } from "@vayura/api-contracts/common";

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

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function SettingsUsers() {
  const tenant = useTenant();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsConsultantAdmin();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TenantRole>("consultant_member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const isSme = useIsSmeWorkspace();
  const adminLabel = tenantMemberRoleLabel("consultant_admin", isSme);
  const memberLabel = tenantMemberRoleLabel("consultant_member", isSme);

  const members = useQuery({
    queryKey: ["team-members", tenant?.id],
    queryFn: listTeamMembers,
    enabled: !!tenant,
  });

  const invite = useMutation({
    mutationFn: () => inviteTeamMember({ email, fullName, role }),
    onSuccess: (data) => {
      const link = `${window.location.origin}${import.meta.env.BASE_URL ?? "/"}accept-team-invite?token=${encodeURIComponent(data.inviteToken)}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );
      setInviteLink(data.emailSent ? null : link);
      setEmail("");
      setFullName("");
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(data.emailSent ? "Invite emailed" : "Invite created", {
        description: data.emailSent
          ? "They will receive a link to set a password."
          : "Email is not configured. Share the invite link below.",
      });
      if (data.emailSent) setOpen(false);
    },
    onError: (e) => {
      toast.error("Invite failed", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, next }: { userId: string; next: TenantRole }) =>
      updateTeamMemberRole(userId, next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (e) => {
      toast.error("Could not change role", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const remove = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(isSme ? "Removed from the workspace" : "Removed from the firm");
    },
    onError: (e) => {
      toast.error("Could not remove member", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  return (
    <>
      <PageHeader
        title={isSme ? "Team & access" : "Firm team"}
        subtitle={
          isSme
            ? `People who can upload, review, and approve emissions data for ${tenant?.name ?? "your organisation"}. Approvals use maker–checker when more than one person is on the team.`
            : `Consultants at ${tenant?.name ?? "your firm"}. Roles and client assignments come from the workspace.`
        }
        actions={
          isAdmin ? (
            <Button onClick={() => setOpen(true)} data-testid="button-invite-user">
              <UserPlus className="w-4 h-4 mr-2" />
              {isSme ? "Invite teammate" : "Invite consultant"}
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isSme ? "Person" : "Consultant"}</TableHead>
                  <TableHead>Role</TableHead>
                  {!isSme && <TableHead>Clients assigned</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={isSme ? 5 : 6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!members.isLoading && members.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isSme ? 5 : 6} className="text-sm text-muted-foreground">
                      No team members yet.
                    </TableCell>
                  </TableRow>
                )}
                {members.data?.map((member) => (
                  <TableRow key={member.id} data-testid={`row-user-${member.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                          {initials(member.fullName, member.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{member.fullName ?? member.email}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin && member.status === "active" ? (
                        <Select
                          value={member.role}
                          onValueChange={(next) =>
                            changeRole.mutate({ userId: member.id, next: next as TenantRole })
                          }
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultant_admin">{adminLabel}</SelectItem>
                            <SelectItem value="consultant_member">{memberLabel}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{tenantMemberRoleLabel(member.role, isSme)}</span>
                      )}
                    </TableCell>
                    {!isSme && (
                      <TableCell className="text-sm tabular-nums">
                        {member.clientsAssigned === null ? "—" : member.clientsAssigned}
                      </TableCell>
                    )}
                    <TableCell className="text-sm capitalize">{member.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.status === "invited" ? "Invite pending" : formatWhen(member.lastActiveAt)}
                    </TableCell>
                    <TableCell>
                      {isAdmin && member.id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => remove.mutate(member.id)}
                            >
                              {member.status === "invited"
                                ? "Cancel invite"
                                : isSme
                                  ? "Remove from workspace"
                                  : "Remove from firm"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>
            {isSme
              ? "Administrators manage billing and team access. Contributors upload and review; they cannot approve their own uploads when another teammate is available."
              : "What each firm role can do. Client viewers are managed per organisation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">{adminLabel}</div>
            <p className="text-muted-foreground mt-1">
              {isSme
                ? "Organisation profile, plan, team invites, period reopen, and verifier onboarding."
                : "Firm profile, plan, branding, team, every client, and client-portal invites."}
            </p>
          </div>
          <div>
            <div className="font-medium">{memberLabel}</div>
            <p className="text-muted-foreground mt-1">
              {isSme
                ? "Uploads, review, reports, and offsets for your organisation."
                : "Uploads, review, and reports for the client organisations they are assigned to."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSme ? "Invite a teammate" : "Invite a consultant"}</DialogTitle>
            <DialogDescription>
              They get a one-time link, valid for 48 hours, to set a password and join {tenant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isSme ? "finance@company.com" : "consultant@firm.com"}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as TenantRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant_member">{memberLabel}</SelectItem>
                  <SelectItem value="consultant_admin">{adminLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteLink && (
              <p className="text-xs text-muted-foreground break-all">
                <Mail className="w-3 h-3 inline mr-1" />
                {inviteLink}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              disabled={!email || fullName.trim().length < 2 || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

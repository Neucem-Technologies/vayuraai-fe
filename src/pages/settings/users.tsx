
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MoreHorizontal, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  useCan,
  useIsSmeWorkspace,
  useTenant,
} from "@/hooks/use-auth";
import {
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  assignClientToMember,
  unassignClientFromMember,
} from "@/lib/team-api";
import { listOrganisations } from "@/lib/organisations-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "sonner";
import type { PermissionCode, TenantRole } from "@vayura/api-contracts/common";
import type { TeamMemberDto } from "@vayura/api-contracts/tenancy";

type TeamMemberWithPermissions = TeamMemberDto & {
  permissionCodes: PermissionCode[];
  assignedOrgIds: string[];
};

const MEMBER_PERMISSION_OPTIONS: {
  code: PermissionCode;
  label: string;
  description: string;
}[] = [
  { code: "facility.manage", label: "Manage facilities", description: "Create and update facilities." },
  { code: "upload.write", label: "Upload data", description: "Upload emissions and supporting data." },
  { code: "review.write", label: "Review data", description: "Review submitted data." },
  { code: "review.approve", label: "Approve reviews", description: "Approve eligible reviews." },
  { code: "emissions.read", label: "View emissions", description: "Read emissions information." },
  { code: "report.write", label: "Create reports", description: "Create and edit reports." },
  { code: "report.download", label: "Download reports", description: "Download available reports." },
  { code: "period.manage", label: "Manage periods", description: "Manage reporting periods." },
  { code: "audit.read", label: "View audit records", description: "Read audit history." },
  { code: "assurance.export", label: "Export assurance data", description: "Export assurance information." },
  { code: "verifier.message", label: "Message verifiers", description: "Communicate with verifiers." },
];

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

  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function SettingsUsers() {
  const tenant = useTenant();
  const user = useAuthStore((s) => s.user);
  const canManageTeam = useCan("team.manage");
  const canAssignClients = useCan("org.assign");
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<TenantRole>("consultant_member");
  const [invitePermissions, setInvitePermissions] = useState<PermissionCode[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const [permissionMember, setPermissionMember] =
    useState<TeamMemberWithPermissions | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionCode[]>([]);

  const [assignmentMember, setAssignmentMember] =
    useState<TeamMemberWithPermissions | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  const isSme = useIsSmeWorkspace();
  const adminLabel = tenantMemberRoleLabel("consultant_admin", isSme);
  const memberLabel = tenantMemberRoleLabel("consultant_member", isSme);

  const members = useQuery({
    queryKey: ["team-members", tenant?.id],
    queryFn: listTeamMembers,
    enabled: !!tenant,
  });

  const organisations = useQuery({
    queryKey: ["organisations", tenant?.id],
    queryFn: listOrganisations,
    enabled: !!tenant && !isSme && canAssignClients,
  });

  const refreshMembers = () => {
    void queryClient.invalidateQueries({ queryKey: ["team-members"] });
  };

  const invite = useMutation({
    mutationFn: () =>
      inviteTeamMember({
        email,
        fullName,
        role,
        permissionCodes: role === "consultant_member" ? invitePermissions : [],
      }),
    onSuccess: (data) => {
      const link = `${window.location.origin}${import.meta.env.BASE_URL ?? "/"}accept-team-invite?token=${encodeURIComponent(data.inviteToken)}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );

      setInviteLink(data.emailSent ? null : link);
      setEmail("");
      setFullName("");
      setInvitePermissions([]);
      refreshMembers();

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
      refreshMembers();
      toast.success("Member role updated");
    },
    onError: (e) => {
      toast.error("Could not change role", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const savePermissions = useMutation({
    mutationFn: ({
      userId,
      permissionCodes,
    }: {
      userId: string;
      permissionCodes: PermissionCode[];
    }) => updateTeamMemberRole(userId, "consultant_member", permissionCodes),
    onSuccess: () => {
      refreshMembers();
      setPermissionMember(null);
      toast.success("Permissions updated");
    },
    onError: (e) => {
      toast.error("Could not update permissions", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const remove = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      refreshMembers();
      toast.success(isSme ? "Removed from the workspace" : "Removed from the firm");
    },
    onError: (e) => {
      toast.error("Could not remove member", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const saveAssignments = useMutation({
    mutationFn: async () => {
      if (!assignmentMember) return;

      const currentIds = assignmentMember.assignedOrgIds ?? [];

      const toAssign = selectedOrgIds.filter(
        (id) => !currentIds.includes(id),
      );

      const toUnassign = currentIds.filter(
        (id) => !selectedOrgIds.includes(id),
      );

      await Promise.all([
        ...toAssign.map((orgId) =>
          assignClientToMember(orgId, assignmentMember.id),
        ),
        ...toUnassign.map((orgId) =>
          unassignClientFromMember(orgId, assignmentMember.id),
        ),
      ]);
    },
    onSuccess: () => {
      refreshMembers();
      setAssignmentMember(null);
      toast.success("Client assignments updated");
    },
    onError: (e) => {
      toast.error("Could not update client assignments", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const togglePermission = (
    current: PermissionCode[],
    code: PermissionCode,
    checked: boolean,
  ): PermissionCode[] =>
    checked
      ? current.includes(code)
        ? current
        : [...current, code]
      : current.filter((item) => item !== code);

  const openPermissionEditor = (member: TeamMemberWithPermissions) => {
    setPermissionMember(member);
    setEditPermissions(member.permissionCodes ?? []);
  };

  const openAssignmentEditor = (member: TeamMemberWithPermissions) => {
    setAssignmentMember(member);
    setSelectedOrgIds(member.assignedOrgIds ?? []);
  };

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
          canManageTeam ? (
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
                  <TableHead>Permissions</TableHead>
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
                      <TableCell colSpan={isSme ? 6 : 7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!members.isLoading && members.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isSme ? 6 : 7}
                      className="text-sm text-muted-foreground"
                    >
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
                          <div className="text-sm font-medium">
                            {member.fullName ?? member.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManageTeam && member.status === "active" ? (
                        <Select
                          value={member.role}
                          onValueChange={(next) =>
                            changeRole.mutate({
                              userId: member.id,
                              next: next as TenantRole,
                            })
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
                        <span className="text-sm">
                          {tenantMemberRoleLabel(member.role, isSme)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {member.role === "consultant_admin"
                        ? "Full admin access"
                        : `${member.permissionCodes?.length ?? 0} assigned`}
                    </TableCell>

                    {!isSme && (
                      <TableCell className="text-sm tabular-nums">
                        {member.clientsAssigned === null ? "—" : member.clientsAssigned}
                      </TableCell>
                    )}

                    <TableCell className="text-sm capitalize">{member.status}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {member.status === "invited"
                        ? "Invite pending"
                        : formatWhen(member.lastActiveAt)}
                    </TableCell>

                    <TableCell>
                      {canManageTeam && member.id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isSme &&
                              canAssignClients &&
                              member.status === "active" &&
                              member.role === "consultant_member" && (
                                <DropdownMenuItem
                                  onClick={() => openAssignmentEditor(member)}
                                >
                                  Manage client access
                                </DropdownMenuItem>
                              )}

                            {member.status === "active" &&
                              member.role === "consultant_member" && (
                                <DropdownMenuItem
                                  onClick={() => openPermissionEditor(member)}
                                >
                                  Manage permissions
                                </DropdownMenuItem>
                              )}

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
              ? "Administrators manage billing and team access. Contributors receive only the permissions assigned to them."
              : "Firm administrators manage the firm. Consultants receive only the permissions assigned to them, subject to their client assignments."}
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
                ? "Access to company operations based on assigned permissions."
                : "Access to client organisations based on assigned permissions and client scope."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setInviteLink(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isSme ? "Invite a teammate" : "Invite a consultant"}
            </DialogTitle>
            <DialogDescription>
              They get a one-time link, valid for 48 hours, to set a password and join {tenant?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
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
              <Select
                value={role}
                onValueChange={(value) => {
                  const nextRole = value as TenantRole;
                  setRole(nextRole);
                  if (nextRole === "consultant_admin") setInvitePermissions([]);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant_member">{memberLabel}</SelectItem>
                  <SelectItem value="consultant_admin">{adminLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "consultant_member" && (
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label>Assign permissions</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select only the capabilities this member needs.
                  </p>
                </div>

                {MEMBER_PERMISSION_OPTIONS.map((permission) => (
                  <label
                    key={permission.code}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={invitePermissions.includes(permission.code)}
                      onCheckedChange={(checked) =>
                        setInvitePermissions((current) =>
                          togglePermission(current, permission.code, Boolean(checked))
                        )
                      }
                    />
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium">
                        {permission.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

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
              disabled={
                !canManageTeam ||
                !email ||
                fullName.trim().length < 2 ||
                invite.isPending
              }
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!permissionMember}
        onOpenChange={(value) => {
          if (!value) setPermissionMember(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage member permissions</DialogTitle>
            <DialogDescription>
              Select the permissions for {permissionMember?.fullName ?? permissionMember?.email}.
              Changes take effect after saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {MEMBER_PERMISSION_OPTIONS.map((permission) => (
              <label
                key={permission.code}
                className="flex items-start gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={editPermissions.includes(permission.code)}
                  onCheckedChange={(checked) =>
                    setEditPermissions((current) =>
                      togglePermission(current, permission.code, Boolean(checked))
                    )
                  }
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {permission.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {permission.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionMember(null)}>
              Cancel
            </Button>
            <Button
              disabled={!canManageTeam || savePermissions.isPending}
              onClick={() => {
                if (!permissionMember) return;

                savePermissions.mutate({
                  userId: permissionMember.id,
                  permissionCodes: editPermissions,
                });
              }}
            >
              {savePermissions.isPending ? "Saving…" : "Save permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignmentMember}
        onOpenChange={(value) => {
          if (!value) setAssignmentMember(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage client access</DialogTitle>
            <DialogDescription>
              Select the client organisations assigned to{" "}
              {assignmentMember?.fullName ?? assignmentMember?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {organisations.isLoading && (
              <Skeleton className="h-8 w-full" />
            )}

            {organisations.data?.map((org) => (
              <label
                key={org.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={selectedOrgIds.includes(org.id)}
                  onCheckedChange={(checked) => {
                    setSelectedOrgIds((current) =>
                      checked
                        ? current.includes(org.id)
                          ? current
                          : [...current, org.id]
                        : current.filter((id) => id !== org.id),
                    );
                  }}
                />
                <span className="text-sm">
                  {org.shortName || org.legalName}
                </span>
              </label>
            ))}

            {!organisations.isLoading &&
              !organisations.data?.length && (
                <p className="text-sm text-muted-foreground">
                  No client organisations found.
                </p>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignmentMember(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !canAssignClients ||
                saveAssignments.isPending ||
                organisations.isLoading
              }
              onClick={() => saveAssignments.mutate()}
            >
              {saveAssignments.isPending ? "Saving..." : "Save assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

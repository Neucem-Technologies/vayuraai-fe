import { useState } from "react";
import {
  UserPlus,
  MoreHorizontal,
  Check,
  X,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUsers, useSmeUsers } from "@/hooks/use-data";
import { useAuthStore, useTenant } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import {
  MOCK_ROLE_PERMISSIONS,
  MOCK_SME_ROLE_PERMISSIONS,
  type ConsultantRole,
  type SmeRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type AccessRole = ConsultantRole | SmeRole;

const CONSULTANT_ROLES: ConsultantRole[] = ["Partner", "Manager", "Consultant", "Analyst"];
const SME_ROLES: SmeRole[] = ["Owner", "Approver", "Contributor", "Viewer"];

const CONSULTANT_ROLE_DESCRIPTIONS: Record<ConsultantRole, string> = {
  Partner: "Owner-level access. Manage firm settings, billing, all clients, and submit reports.",
  Manager: "Lead engagements end-to-end. Add clients, approve emissions, and manage the team.",
  Consultant: "Day-to-day delivery. Upload data, edit records, and approve emissions for assigned clients.",
  Analyst: "Hands-on data work. Upload, extract, and prepare records — approvals require a Consultant or above.",
};

const SME_ROLE_DESCRIPTIONS: Record<SmeRole, string> = {
  Owner: "Full organization access. Manage users, reporting boundary, approvals, and submission evidence.",
  Approver: "Can review data, approve emissions records, and generate reports for internal sign-off.",
  Contributor: "Can upload evidence and edit extracted activity data before approval.",
  Viewer: "Read-only access to dashboards, emissions, uploads, and reports.",
};

export default function SettingsUsers() {
  const { user } = useAuthStore();
  const tenant = useTenant();
  const activeClient = useActiveClient();
  const isSme = user?.userType === "sme";
  const { data: consultantUsers, isLoading: consultantsLoading } = useUsers();
  const { data: smeUsers, isLoading: smeUsersLoading } = useSmeUsers();
  const [open, setOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<AccessRole>("Consultant");

  const roles = (isSme ? SME_ROLES : CONSULTANT_ROLES) as AccessRole[];
  const users = isSme ? smeUsers : consultantUsers;
  const isLoading = isSme ? smeUsersLoading : consultantsLoading;
  const permissions = isSme ? MOCK_SME_ROLE_PERMISSIONS : MOCK_ROLE_PERMISSIONS;
  const selectedInviteRole = roles.includes(inviteRole) ? inviteRole : roles[0];

  const describeRole = (role: AccessRole) =>
    isSme
      ? SME_ROLE_DESCRIPTIONS[role as SmeRole]
      : CONSULTANT_ROLE_DESCRIPTIONS[role as ConsultantRole];

  return (
    <>
      <PageHeader
        title={isSme ? "Users & access" : "Firm team"}
        subtitle={
          isSme
            ? `People at ${activeClient?.name ?? user?.company ?? "your organization"}. Assign roles, manage access, and control who can upload, approve, and report.`
            : `Consultants at ${tenant?.name ?? user?.company ?? "your firm"}. Assign roles, manage access, and review what each role can do across every client.`
        }
        actions={
          <Button onClick={() => setOpen(true)} data-testid="button-invite-user">
            <UserPlus className="w-4 h-4 mr-2" />
            {isSme ? "Invite user" : "Invite consultant"}
          </Button>
        }
      />

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" data-testid="tab-members">Team members</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Roles & permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isSme ? "User" : "Consultant"}</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>{isSme ? "Function" : "Clients assigned"}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && users?.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                              {u.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={u.role}>
                            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {roles.map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {"clientsAssigned" in u ? (
                            u.clientsAssigned > 0 ? (
                              <span className="font-medium">{u.clientsAssigned}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <span>{u.function}</span>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={u.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.lastActive}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-user-${u.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>{isSme ? "Manage access" : "Manage client assignments"}</DropdownMenuItem>
                              {u.status === "Invited" && <DropdownMenuItem><Mail className="w-4 h-4 mr-2" /> Resend invite</DropdownMenuItem>}
                              <DropdownMenuItem>Reset password</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                {isSme ? "Remove from organization" : "Remove from firm"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
            {roles.map((role) => (
              <Card key={role}>
                <CardContent className="p-4">
                  <div className="text-base font-semibold text-foreground">{role}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{describeRole(role)}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {users?.filter((u) => u.role === role).length ?? 0} active members
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Permission matrix</CardTitle>
              <CardDescription>What each role can and cannot do across Vayura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Permission</TableHead>
                      {roles.map((r) => (
                        <TableHead key={r} className="text-center">{r}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((p) => (
                      <TableRow key={p.permission}>
                        <TableCell className="text-sm">{p.permission}</TableCell>
                        {roles.map((role) => (
                          <TableCell key={role} className="text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded-full",
                              p[role as keyof typeof p] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40",
                            )}>
                              {p[role as keyof typeof p] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSme ? "Invite an organization user" : "Invite a consultant"}</DialogTitle>
            <DialogDescription>
              They'll get an email to join {isSme ? activeClient?.name ?? user?.company ?? "your organization" : tenant?.name ?? user?.company ?? "your firm"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Email address</Label>
              <Input
                className="mt-1"
                placeholder={isSme ? "user@company.com" : "consultant@greenedge.in"}
                data-testid="input-invite-email"
              />
            </div>
            <div>
              <Label className="text-sm">Role</Label>
              <Select value={selectedInviteRole} onValueChange={(v) => setInviteRole(v as AccessRole)}>
                <SelectTrigger className="mt-1" data-testid="select-invite-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">{describeRole(selectedInviteRole)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)} data-testid="button-send-invite">
              <Mail className="w-4 h-4 mr-2" /> Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

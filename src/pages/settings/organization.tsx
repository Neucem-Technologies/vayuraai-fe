import { useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users as UsersIcon,
  Mail,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFacilities } from "@/hooks/use-data";
import { useActiveClient } from "@/hooks/use-active-client";

export default function SettingsOrganization() {
  const { data: facilities, isLoading } = useFacilities();
  const activeClient = useActiveClient();
  const [open, setOpen] = useState(false);

  const clientName = activeClient?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Client profile"
        subtitle={`Legal entity, reporting boundary, and operational facilities for ${clientName}`}
        actions={
          activeClient && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {activeClient.reportingStandard} · {activeClient.reportingStatus}
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Legal entity</CardTitle>
            <CardDescription>Used on cover pages and regulatory submissions for {clientName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Legal name</Label>
                <Input className="mt-1" defaultValue={activeClient?.name ?? ""} data-testid="input-client-legal-name" />
              </div>
              <div>
                <Label className="text-sm">CIN / Registration number</Label>
                <Input className="mt-1" defaultValue="U72200KA2014PTC076234" />
              </div>
              <div>
                <Label className="text-sm">Country</Label>
                <Select defaultValue={activeClient?.country ?? "India"}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="UAE">United Arab Emirates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Industry</Label>
                <Input className="mt-1" defaultValue={activeClient?.industry ?? ""} />
              </div>
              <div>
                <Label className="text-sm">Fiscal year start</Label>
                <Select defaultValue={activeClient?.fiscalYearStart ?? "April"}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["January","April","July","October"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Reporting standard</Label>
                <Select defaultValue={activeClient?.reportingStandard ?? "BRSR"}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRSR">BRSR (SEBI)</SelectItem>
                    <SelectItem value="GRI">GRI Standards</SelectItem>
                    <SelectItem value="BOTH">Both BRSR and GRI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Default currency</Label>
                <Select defaultValue="INR">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Engagement since</Label>
                <Input className="mt-1" defaultValue={activeClient?.engagementSince ?? ""} readOnly />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button data-testid="button-save-client">Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reporting boundary</CardTitle>
              <CardDescription>What's included in this client's inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Consolidation approach</Label>
                <Select defaultValue="operational">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational control</SelectItem>
                    <SelectItem value="financial">Financial control</SelectItem>
                    <SelectItem value="equity">Equity share</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center p-2 rounded-md border">
                  <div className="text-lg font-semibold tabular-nums">{facilities?.length ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Facilities</div>
                </div>
                <div className="text-center p-2 rounded-md border">
                  <div className="text-lg font-semibold tabular-nums">{activeClient?.dataSourcesActive ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Data sources</div>
                </div>
                <div className="text-center p-2 rounded-md border">
                  <div className="text-lg font-semibold tabular-nums">{activeClient ? `${(activeClient.employees / 1000).toFixed(1)}K` : "—"}</div>
                  <div className="text-[11px] text-muted-foreground">Employees</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primary contact</CardTitle>
              <CardDescription>The person at {activeClient?.shortName ?? "the client"} who owns sustainability data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                  {activeClient?.primaryContact.name.split(" ").map(n => n[0]).join("").substring(0, 2) ?? "—"}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{activeClient?.primaryContact.name}</div>
                  <div className="text-xs text-muted-foreground">{activeClient?.primaryContact.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
                <Mail className="w-3.5 h-3.5" /> {activeClient?.primaryContact.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Phone className="w-3.5 h-3.5" /> Lead consultant: {activeClient?.leadConsultant}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Facilities</CardTitle>
              <CardDescription>Locations included in {clientName}'s reporting boundary</CardDescription>
            </div>
            <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-facility">
              <Plus className="w-4 h-4 mr-2" /> Add facility
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
            {!isLoading && facilities?.map((f) => (
              <div key={f.id} className="rounded-md border p-4 flex items-start gap-4 hover-elevate">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{f.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {f.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted font-medium">{f.type}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {f.employees} employees</span>
                    <span className="text-muted-foreground">{f.country}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a facility</DialogTitle>
            <DialogDescription>Add a new operational location to {clientName}'s reporting boundary.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Facility name</Label>
              <Input className="mt-1" placeholder="e.g. Chennai R&D Center" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Type</Label>
                <Select defaultValue="Office">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Office","Manufacturing","Data Center","Warehouse","R&D"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Country</Label>
                <Input className="mt-1" defaultValue="India" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Address</Label>
              <Input className="mt-1" placeholder="Street, city, state, PIN" />
            </div>
            <div>
              <Label className="text-sm">Approximate employees</Label>
              <Input className="mt-1" type="number" placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Add facility</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

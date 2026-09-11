import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Trash2,
  MapPin,
  Users as UsersIcon,
  Sun,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { AddFacilityDialog } from "@/components/add-facility-dialog";
import { ClientPortalSettings } from "@/components/client-portal-settings";
import { useFacilities, useOrganisation } from "@/hooks/use-data";
import { useActiveClient } from "@/hooks/use-active-client";
import { useAuthStore } from "@/hooks/use-auth";
import { deleteFacility } from "@/lib/facilities-api";
import { isGenerationFacility } from "@/lib/facilities";
import { updateOrganisation } from "@/lib/organisations-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { ConsolidationApproach, FacilityPurpose } from "@vayura/api-contracts/common";
import {
  numberToFormValue,
  orgReportingFormDefaults,
  reportingFormToApi,
  type OrgReportingFormValues,
} from "@/lib/org-reporting-profile";

function statusBadgeClass(status: string | undefined) {
  if (status === "Active") return "bg-primary/10 text-primary border-primary/20";
  if (status === "Onboarding") return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function SettingsOrganization() {
  const activeClient = useActiveClient();
  const orgId = activeClient?.id ?? null;
  const { data: facilities, isLoading } = useFacilities(orgId);
  const { data: organisation } = useOrganisation(orgId);
  const canEnableClientPortal = useAuthStore((s) => s.access?.canEnableClientPortal ?? false);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [addPurpose, setAddPurpose] = useState<FacilityPurpose>("operations");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [legalName, setLegalName] = useState("");
  const [shortName, setShortName] = useState("");
  const [country, setCountry] = useState("India");
  const [industry, setIndustry] = useState("");
  const [consolidationApproach, setConsolidationApproach] =
    useState<ConsolidationApproach>("operational");
  const [reporting, setReporting] = useState<OrgReportingFormValues>(orgReportingFormDefaults);

  const patchReporting = (key: keyof OrgReportingFormValues, value: string) => {
    setReporting((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (organisation) {
      setLegalName(organisation.legalName);
      setShortName(organisation.shortName);
      setCountry(organisation.country || "India");
      setIndustry(organisation.industry ?? "");
      setConsolidationApproach(organisation.consolidationApproach ?? "operational");
      setReporting({
        cin: organisation.cin ?? "",
        lei: organisation.lei ?? "",
        gstin: organisation.gstin ?? "",
        yearOfIncorporation: numberToFormValue(organisation.yearOfIncorporation),
        registeredOfficeAddress: organisation.registeredOfficeAddress ?? "",
        website: organisation.website ?? "",
        email: organisation.email ?? "",
        telephone: organisation.telephone ?? "",
        stockExchanges: organisation.stockExchanges ?? "",
        paidUpCapitalInr: numberToFormValue(organisation.paidUpCapitalInr),
        employeeCount: numberToFormValue(organisation.employeeCount),
        workerCount: numberToFormValue(organisation.workerCount),
        annualTurnoverInr: numberToFormValue(organisation.annualTurnoverInr),
        contactName: organisation.contactName ?? "",
        contactEmail: organisation.contactEmail ?? "",
        contactPhone: organisation.contactPhone ?? "",
      });
      return;
    }
    if (!activeClient) return;
    setLegalName(activeClient.name);
    setShortName(activeClient.shortName);
    setCountry(activeClient.country || "India");
    setIndustry(activeClient.industry ?? "");
    setConsolidationApproach(activeClient.consolidationApproach ?? "operational");
  }, [organisation, activeClient]);

  // Refresh portfolio status after facilities load (backend may promote onboarding → active).
  useEffect(() => {
    if (!orgId || isLoading) return;
    void queryClient.invalidateQueries({ queryKey: ["clients"] });
    void queryClient.invalidateQueries({ queryKey: ["client", orgId] });
  }, [orgId, isLoading, facilities?.length, queryClient]);

  const clientName = activeClient?.name ?? "—";

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!orgId) throw new Error("Select a client first.");
      return updateOrganisation(orgId, {
        legalName: legalName.trim(),
        shortName: shortName.trim(),
        country: country.trim() || "India",
        industry: industry.trim() ? industry.trim() : null,
        consolidationApproach,
        ...reportingFormToApi(reporting),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (orgId) {
        await queryClient.invalidateQueries({ queryKey: ["client", orgId] });
        await queryClient.invalidateQueries({ queryKey: ["organisation", orgId] });
      }
      toast({ title: "Client profile saved" });
    },
    onError: (e) => {
      const message = e instanceof ApiRequestError ? e.message : "Could not save client profile.";
      toast({ title: "Could not save", description: message, variant: "destructive" });
    },
  });

  const removeFacility = useMutation({
    mutationFn: (facilityId: string) => {
      if (!orgId) throw new Error("Select a client first.");
      return deleteFacility(orgId, facilityId);
    },
    onSuccess: async () => {
      if (orgId) await queryClient.invalidateQueries({ queryKey: ["facilities", orgId] });
      toast({ title: "Facility removed" });
    },
    onError: (e) => {
      const message = e instanceof ApiRequestError ? e.message : "Could not remove facility.";
      toast({ title: "Could not remove facility", description: message, variant: "destructive" });
    },
    onSettled: () => setDeletingId(null),
  });

  const canSave =
    !!orgId &&
    legalName.trim().length >= 2 &&
    shortName.trim().length >= 1 &&
    !saveMutation.isPending;

  const operationSites = useMemo(
    () => (facilities ?? []).filter((f) => !isGenerationFacility(f.purpose)),
    [facilities],
  );
  const generationSites = useMemo(
    () => (facilities ?? []).filter((f) => isGenerationFacility(f.purpose)),
    [facilities],
  );

  const openAdd = (purpose: FacilityPurpose) => {
    setAddPurpose(purpose);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Client profile"
        subtitle={`Legal entity, reporting boundary, operations, and generation / offset sites for ${clientName}`}
        actions={
          activeClient && (
            <Badge variant="outline" className={statusBadgeClass(activeClient.status)}>
              {activeClient.status}
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Legal entity</CardTitle>
            <CardDescription>Used on BRSR Section A, GRI 2, and GHG cover pages for {clientName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Legal name</Label>
                <Input
                  className="mt-1"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  data-testid="input-client-legal-name"
                />
              </div>
              <div>
                <Label className="text-sm">Short name</Label>
                <Input
                  className="mt-1"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  data-testid="input-client-short-name"
                />
              </div>
              <div>
                <Label className="text-sm">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1" data-testid="select-client-country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="UAE">United Arab Emirates</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="USA">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Industry</Label>
                <Input
                  className="mt-1"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Manufacturing"
                  data-testid="input-client-industry"
                />
              </div>
              <div>
                <Label className="text-sm">Engagement since</Label>
                <Input className="mt-1" value={activeClient?.engagementSince ?? ""} readOnly />
              </div>
              <ProfileField label="CIN" value={reporting.cin} onChange={(v) => patchReporting("cin", v)} placeholder="L12345MH2010PLC123456" testId="input-client-cin" />
              <ProfileField label="LEI" value={reporting.lei} onChange={(v) => patchReporting("lei", v)} placeholder="20-character LEI" testId="input-client-lei" />
              <ProfileField label="GSTIN" value={reporting.gstin} onChange={(v) => patchReporting("gstin", v)} testId="input-client-gstin" />
              <ProfileField label="Year of incorporation" value={reporting.yearOfIncorporation} onChange={(v) => patchReporting("yearOfIncorporation", v)} placeholder="2012" testId="input-client-year" />
              <div className="sm:col-span-2">
                <Label className="text-sm">Registered office address</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={reporting.registeredOfficeAddress}
                  onChange={(e) => patchReporting("registeredOfficeAddress", e.target.value)}
                  data-testid="input-client-address"
                />
              </div>
              <ProfileField label="Website" value={reporting.website} onChange={(v) => patchReporting("website", v)} placeholder="https://" testId="input-client-website" />
              <ProfileField label="Entity email" value={reporting.email} onChange={(v) => patchReporting("email", v)} testId="input-client-email" />
              <ProfileField label="Telephone" value={reporting.telephone} onChange={(v) => patchReporting("telephone", v)} testId="input-client-telephone" />
              <ProfileField label="Stock exchange(s)" value={reporting.stockExchanges} onChange={(v) => patchReporting("stockExchanges", v)} placeholder="NSE, BSE" testId="input-client-exchanges" />
              <ProfileField label="Paid-up capital (INR)" value={reporting.paidUpCapitalInr} onChange={(v) => patchReporting("paidUpCapitalInr", v)} testId="input-client-paid-up" />
              <ProfileField label="Permanent employees" value={reporting.employeeCount} onChange={(v) => patchReporting("employeeCount", v)} testId="input-client-employees" />
              <ProfileField label="Workers (other than employees)" value={reporting.workerCount} onChange={(v) => patchReporting("workerCount", v)} testId="input-client-workers" />
              <ProfileField label="Annual turnover (INR)" value={reporting.annualTurnoverInr} onChange={(v) => patchReporting("annualTurnoverInr", v)} testId="input-client-turnover" />
              <ProfileField label="Reporting contact name" value={reporting.contactName} onChange={(v) => patchReporting("contactName", v)} testId="input-client-contact-name" />
              <ProfileField label="Reporting contact email" value={reporting.contactEmail} onChange={(v) => patchReporting("contactEmail", v)} testId="input-client-contact-email" />
              <ProfileField label="Reporting contact phone" value={reporting.contactPhone} onChange={(v) => patchReporting("contactPhone", v)} testId="input-client-contact-phone" />
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!canSave}
                data-testid="button-save-client"
              >
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
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
                <Select
                  value={consolidationApproach}
                  onValueChange={(v) => setConsolidationApproach(v as ConsolidationApproach)}
                >
                  <SelectTrigger className="mt-1" data-testid="select-consolidation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational control</SelectItem>
                    <SelectItem value="financial">Financial control</SelectItem>
                    <SelectItem value="equity">Equity share</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  GHG Protocol organisational boundary. Saved with the legal entity.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-4 rounded-md border">
                  <div className="text-lg font-semibold tabular-nums">{operationSites.length}</div>
                  <div className="text-[11px] text-muted-foreground">Operations</div>
                </div>
                <div className="text-center p-4 rounded-md border">
                  <div className="text-lg font-semibold tabular-nums">{generationSites.length}</div>
                  <div className="text-[11px] text-muted-foreground">Generation / offset</div>
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={!canSave}
                data-testid="button-save-boundary"
              >
                {saveMutation.isPending ? "Saving…" : "Save boundary"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {organisation && (
        <ClientPortalSettings org={organisation} canEnablePortal={canEnableClientPortal} />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Operations</CardTitle>
              <CardDescription>Offices, plants, and other sites that consume energy</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => openAdd("operations")}
              disabled={!orgId}
              data-testid="button-add-facility"
            >
              <Plus className="w-4 h-4 mr-2" /> Add facility
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {isLoading && Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
            {!isLoading && operationSites.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No operations sites yet. Add locations so uploads can be assigned to a consuming facility.
              </div>
            )}
            {!isLoading && operationSites.map((f) => (
              <FacilityRow
                key={f.id}
                name={f.name}
                type={f.type}
                address={f.address}
                country={f.country}
                employees={f.employees}
                generation={false}
                deleting={deletingId === f.id}
                onDelete={() => {
                  setDeletingId(f.id);
                  removeFacility.mutate(f.id);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Generation / offset sites</CardTitle>
              <CardDescription>
                Solar, wind, hydro, or captive power. Self-consumed kWh lowers residual Scope 2; it is not netted off the BRSR gross total.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openAdd("generation")}
              disabled={!orgId}
              data-testid="button-add-generation-facility"
            >
              <Plus className="w-4 h-4 mr-2" /> Add generation site
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {isLoading && <Skeleton className="h-20" />}
            {!isLoading && generationSites.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No generation sites yet. Add rooftop solar, wind, or a captive plant to track energy that can reduce residual emissions.
              </div>
            )}
            {!isLoading && generationSites.map((f) => (
              <FacilityRow
                key={f.id}
                name={f.name}
                type={f.type}
                address={f.address}
                country={f.country}
                employees={f.employees}
                generation
                deleting={deletingId === f.id}
                onDelete={() => {
                  setDeletingId(f.id);
                  removeFacility.mutate(f.id);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {orgId && (
        <AddFacilityDialog
          orgId={orgId}
          open={open}
          onOpenChange={setOpen}
          defaultCountry={country || "India"}
          defaultPurpose={addPurpose}
          clientName={clientName}
          onCreated={async () => {
            await queryClient.invalidateQueries({ queryKey: ["clients"] });
            await queryClient.invalidateQueries({ queryKey: ["client", orgId] });
          }}
        />
      )}
    </>
  );
}

function FacilityRow({
  name,
  type,
  address,
  country,
  employees,
  generation,
  deleting,
  onDelete,
}: {
  name: string;
  type: string;
  address: string;
  country: string;
  employees: number;
  generation: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border p-4 flex items-start gap-4 hover-elevate">
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        {generation ? <Sun className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {address || "—"}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive shrink-0"
            disabled={deleting}
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-muted font-medium">{type}</span>
          {generation ? (
            <span className="text-muted-foreground">Generation / offset</span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {employees} employees</span>
          )}
          <span className="text-muted-foreground">{country}</span>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
      />
    </div>
  );
}

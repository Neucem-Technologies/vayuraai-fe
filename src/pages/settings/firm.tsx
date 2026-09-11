import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  KeyRound,
  Palette,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Upload,
  Trash2,
  FileText,
} from "lucide-react";
import { useAuthStore, useTenant } from "@/hooks/use-auth";
import { usePortfolioStats } from "@/hooks/use-data";
import {
  deleteTenantReportLogo,
  fetchBrandingPreviewPdf,
  fetchTenantReportLogoBlob,
  normalizeHexColor,
  updateTenantBranding,
  uploadTenantReportLogo,
  type ReportLogoPlacement,
} from "@/lib/tenant-api";
import { ApiRequestError } from "@/lib/api-client";
import { toast } from "sonner";
import type { TenantPlan } from "@vayura/api-contracts/common";
import { cn } from "@/lib/utils";

const AUTH_SNAPSHOT_KEY = "vayura_auth";

const LOGO_PLACEMENTS: Array<{ value: ReportLogoPlacement; label: string }> = [
  { value: "header_left", label: "Header — left" },
  { value: "header_center", label: "Header — center" },
  { value: "header_right", label: "Header — right" },
  { value: "footer_left", label: "Footer — left" },
  { value: "footer_center", label: "Footer — center" },
  { value: "footer_right", label: "Footer — right" },
];

function formatPlan(plan: TenantPlan | undefined): string {
  if (!plan) return "—";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function persistTenantUpdate(tenant: NonNullable<ReturnType<typeof useTenant>>) {
  const state = useAuthStore.getState();
  useAuthStore.setState({ tenant });
  try {
    localStorage.setItem(
      AUTH_SNAPSHOT_KEY,
      JSON.stringify({
        user: state.user,
        tenant,
        access: state.access,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
      }),
    );
  } catch {
    /* ignore */
  }
}

export default function FirmSettings() {
  const tenant = useTenant();
  const { data: stats } = usePortfolioStats();
  const [revealKey, setRevealKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [whiteLabel, setWhiteLabel] = useState(false);
  const [brandColor, setBrandColor] = useState("#1F4D33");
  const [footerDisclaimer, setFooterDisclaimer] = useState("");
  const [logoPlacement, setLogoPlacement] = useState<ReportLogoPlacement>("header_left");
  const [hasLogo, setHasLogo] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  // Sync from server tenant only when those fields change — not on every new object
  // reference (which would wipe in-progress edits / optimistic toggle state).
  useEffect(() => {
    if (!tenant) return;
    setWhiteLabel(Boolean(tenant.whiteLabelEnabled));
    setBrandColor(tenant.brandColorHex ?? "#1F4D33");
    setFooterDisclaimer(tenant.reportFooterDisclaimer ?? "");
    setLogoPlacement(tenant.reportLogoPlacement ?? "header_left");
    setHasLogo(Boolean(tenant.hasReportLogo));
  }, [
    tenant?.id,
    tenant?.whiteLabelEnabled,
    tenant?.brandColorHex,
    tenant?.reportFooterDisclaimer,
    tenant?.reportLogoPlacement,
    tenant?.hasReportLogo,
  ]);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    if (!hasLogo) {
      setLogoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    void (async () => {
      const blob = await fetchTenantReportLogoBlob();
      if (cancelled || !blob) return;
      const url = URL.createObjectURL(blob);
      revoked = url;
      setLogoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [hasLogo, tenant?.id, tenant?.hasReportLogo]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const firmName = tenant?.name ?? "";
  const apiKey = "vyr_live_a4f2b81c93d45e2710fa8b37c612e9d4";
  const masked = "vyr_live_••••••••••••••••••••••••••••";
  const footerText =
    footerDisclaimer.trim() ||
    (whiteLabel ? `Prepared by ${firmName || "your firm"}` : "Generated by Vayura AI.");

  const previewColor = useMemo(() => normalizeHexColor(brandColor), [brandColor]);
  const colorInvalid = brandColor.trim().length > 0 && !previewColor;
  const headerPlacement = logoPlacement.startsWith("header_");
  const showLogo = Boolean(whiteLabel && hasLogo && logoPreviewUrl);
  const displayFirm = whiteLabel ? firmName || "Your firm" : "Vayura AI";

  const whiteLabelMutation = useMutation({
    mutationFn: (enabled: boolean) => updateTenantBranding({ whiteLabelEnabled: enabled }),
    onSuccess: (updated) => {
      persistTenantUpdate(updated);
      setWhiteLabel(Boolean(updated.whiteLabelEnabled));
      toast.success(
        updated.whiteLabelEnabled ? "White-label enabled" : "White-label disabled",
        {
          description: updated.whiteLabelEnabled
            ? "Client report PDFs will use your firm branding."
            : "Client report PDFs will use Vayura branding.",
        },
      );
    },
    onError: (e, enabled) => {
      setWhiteLabel(!enabled);
      toast.error("Could not update white-label", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const brandingMutation = useMutation({
    mutationFn: (input: {
      whiteLabelEnabled: boolean;
      brandColorHex: string;
      reportFooterDisclaimer: string;
      reportLogoPlacement: ReportLogoPlacement;
    }) => updateTenantBranding(input),
    onSuccess: (updated) => {
      persistTenantUpdate(updated);
      setWhiteLabel(Boolean(updated.whiteLabelEnabled));
      setHasLogo(Boolean(updated.hasReportLogo));
      toast.success("Report branding saved", {
        description: updated.whiteLabelEnabled
          ? "Client report PDFs will use your firm colour, logo, and footer."
          : "White-label is off — PDFs use Vayura branding.",
      });
    },
    onError: (e) => {
      toast.error("Could not save branding", {
        description: e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Try again.",
      });
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => uploadTenantReportLogo(file),
    onSuccess: (updated) => {
      persistTenantUpdate(updated);
      setHasLogo(true);
      toast.success("Logo uploaded", { description: "It will appear on branded report PDFs." });
    },
    onError: (e) => {
      toast.error("Logo upload failed", {
        description: e instanceof ApiRequestError ? e.message : "Use PNG, JPEG, or WebP under 2 MB.",
      });
    },
  });

  const logoDeleteMutation = useMutation({
    mutationFn: () => deleteTenantReportLogo(),
    onSuccess: (updated) => {
      persistTenantUpdate(updated);
      setHasLogo(false);
      toast.success("Logo removed");
    },
    onError: (e) => {
      toast.error("Could not remove logo", {
        description: e instanceof ApiRequestError ? e.message : "Try again.",
      });
    },
  });

  const previewPdfMutation = useMutation({
    mutationFn: async () => {
      if (!previewColor) throw new Error("Enter a valid HEX colour first.");
      return fetchBrandingPreviewPdf({
        whiteLabelEnabled: whiteLabel,
        brandColorHex: previewColor,
        reportFooterDisclaimer: footerDisclaimer,
        reportLogoPlacement: logoPlacement,
      });
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPdfPreviewOpen(true);
    },
    onError: (e) => {
      toast.error("Preview failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    },
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <PageHeader
        title="Firm settings"
        subtitle={
          tenant
            ? `Manage ${tenant.name}, your subscription, and consultant-wide preferences`
            : "Manage your firm, subscription, and consultant-wide preferences"
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Firm profile</CardTitle>
              </div>
              <CardDescription>The legal entity that owns this Vayura AI account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Firm legal name</Label>
                  <Input defaultValue={firmName} className="mt-1.5" data-testid="input-firm-name" />
                </div>
                <div>
                  <Label>Display name</Label>
                  <Input defaultValue={firmName} className="mt-1.5" data-testid="input-firm-display" />
                </div>
                <div>
                  <Label>Country of incorporation</Label>
                  <Select defaultValue="india">
                    <SelectTrigger className="mt-1.5" data-testid="select-firm-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="uae">United Arab Emirates</SelectItem>
                      <SelectItem value="sg">Singapore</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input placeholder="yourfirm.com" className="mt-1.5" />
                </div>
                <div className="md:col-span-2">
                  <Label>Registered address</Label>
                  <Input placeholder="Street, city, state, postal code" className="mt-1.5" />
                </div>
                <div>
                  <Label>Billing contact</Label>
                  <Input type="email" placeholder="billing@yourfirm.com" className="mt-1.5" />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input placeholder="Tax registration number" className="mt-1.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline">Cancel</Button>
                <Button data-testid="button-save-firm">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Report branding</CardTitle>
              </div>
              <CardDescription>
                Logo, colours, and footer text applied to client-facing disclosure PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="font-medium text-sm">White-label exports</div>
                  <div className="text-xs text-muted-foreground">
                    Client reports show {firmName || "your firm"} branding instead of Vayura.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={whiteLabel ? "default" : "outline"}
                  size="sm"
                  disabled={whiteLabelMutation.isPending}
                  onClick={() => {
                    const next = !whiteLabel;
                    setWhiteLabel(next);
                    whiteLabelMutation.mutate(next);
                  }}
                  data-testid="button-toggle-whitelabel"
                >
                  {whiteLabelMutation.isPending
                    ? "Saving…"
                    : whiteLabel
                      ? "Enabled"
                      : "Disabled"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Brand colour (HEX)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div
                      className={cn("w-9 h-9 rounded border shrink-0", !previewColor && "bg-muted")}
                      style={previewColor ? { backgroundColor: previewColor } : undefined}
                      data-testid="brand-color-preview"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#1F4D33"
                      className={cn("flex-1 font-mono", colorInvalid && "border-destructive")}
                      data-testid="input-brand-color"
                    />
                  </div>
                </div>
                <div>
                  <Label>Footer disclaimer</Label>
                  <Input
                    value={footerDisclaimer}
                    onChange={(e) => setFooterDisclaimer(e.target.value)}
                    placeholder={`Prepared by ${firmName || "your firm"}`}
                    className="mt-1.5"
                    data-testid="input-footer-disclaimer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Report logo</Label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) logoUploadMutation.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={logoUploadMutation.isPending}
                      onClick={() => logoInputRef.current?.click()}
                      data-testid="button-upload-report-logo"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoUploadMutation.isPending ? "Uploading…" : hasLogo ? "Replace logo" : "Upload logo"}
                    </Button>
                    {hasLogo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={logoDeleteMutation.isPending}
                        onClick={() => logoDeleteMutation.mutate()}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, or WebP · max 2 MB</p>
                </div>
                <div>
                  <Label>Logo placement (all pages)</Label>
                  <Select
                    value={logoPlacement}
                    onValueChange={(v) => setLogoPlacement(v as ReportLogoPlacement)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-logo-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGO_PLACEMENTS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                className="rounded-md border overflow-hidden bg-white shadow-sm"
                data-testid="branding-pdf-preview-card"
              >
                {/* Header — mirrors PDF drawHeaderFooter */}
                <div
                  className="min-h-12 px-4 py-2 text-white"
                  style={{ backgroundColor: whiteLabel && previewColor ? previewColor : "#1F4D33" }}
                >
                  {showLogo && logoPlacement === "header_center" ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={logoPreviewUrl!}
                        alt=""
                        className="h-7 w-auto max-w-[72px] object-contain rounded-sm bg-white/10 p-0.5"
                      />
                      <div className="text-center min-w-0">
                        <div className="text-xs font-semibold truncate">{displayFirm}</div>
                        <div className="text-[10px] text-white/80">GHG Protocol · sample client</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {showLogo && logoPlacement === "header_left" && (
                        <img
                          src={logoPreviewUrl!}
                          alt=""
                          className="h-7 w-auto max-w-[72px] object-contain rounded-sm bg-white/10 p-0.5 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{displayFirm}</div>
                        <div className="text-[10px] text-white/80">GHG Protocol · sample client</div>
                      </div>
                      {showLogo && logoPlacement === "header_right" && (
                        <img
                          src={logoPreviewUrl!}
                          alt=""
                          className="h-7 w-auto max-w-[72px] object-contain rounded-sm bg-white/10 p-0.5 shrink-0"
                        />
                      )}
                      {!showLogo || !headerPlacement ? (
                        <div className="text-[10px] text-white/80 shrink-0 hidden sm:block">Disclosure report</div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-100" />
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {["Total", "S1", "S2", "S3"].map((label) => (
                      <div
                        key={label}
                        className="rounded border p-2"
                        style={{ borderLeftWidth: 3, borderLeftColor: previewColor ?? "#1F4D33" }}
                      >
                        <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
                        <div className="text-xs font-semibold mt-0.5">12.5 t</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded overflow-hidden border">
                    <div
                      className="h-6 text-[10px] text-white flex items-center px-2"
                      style={{ backgroundColor: previewColor ?? "#1F4D33" }}
                    >
                      Scope · Category · tCO₂e
                    </div>
                    <div className="h-5 bg-slate-50 text-[10px] px-2 flex items-center text-muted-foreground">
                      Electricity · 5.8
                    </div>
                    <div className="h-5 text-[10px] px-2 flex items-center text-muted-foreground">
                      Fuel · 4.2
                    </div>
                  </div>
                </div>

                {/* Footer — mirrors PDF drawHeaderFooter */}
                <div
                  className="min-h-10 px-4 py-2 border-t text-[10px] text-muted-foreground"
                  style={{ backgroundColor: `${previewColor ?? "#1F4D33"}14` }}
                >
                  {showLogo && logoPlacement === "footer_center" ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={logoPreviewUrl!}
                        alt=""
                        className="h-5 w-auto max-w-[48px] object-contain"
                      />
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate text-center flex-1">{footerText}</span>
                        <span className="shrink-0 tabular-nums">Page 1 of 2</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {showLogo && logoPlacement === "footer_left" && (
                        <img
                          src={logoPreviewUrl!}
                          alt=""
                          className="h-5 w-auto max-w-[48px] object-contain shrink-0"
                        />
                      )}
                      <span className="truncate flex-1 min-w-0">{footerText}</span>
                      {showLogo && logoPlacement === "footer_right" && (
                        <img
                          src={logoPreviewUrl!}
                          alt=""
                          className="h-5 w-auto max-w-[48px] object-contain shrink-0"
                        />
                      )}
                      <span className="shrink-0 tabular-nums">Page 1 of 2</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  disabled={previewPdfMutation.isPending || !previewColor}
                  onClick={() => previewPdfMutation.mutate()}
                  data-testid="button-preview-branding-pdf"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {previewPdfMutation.isPending ? "Rendering…" : "Preview sample PDF"}
                </Button>
                <Button
                  type="button"
                  disabled={brandingMutation.isPending || !previewColor}
                  onClick={() => {
                    if (!previewColor) {
                      toast.error("Enter a valid HEX colour like #1F4D33.");
                      return;
                    }
                    brandingMutation.mutate({
                      whiteLabelEnabled: whiteLabel,
                      brandColorHex: previewColor,
                      reportFooterDisclaimer: footerDisclaimer,
                      reportLogoPlacement: logoPlacement,
                    });
                  }}
                  data-testid="button-save-branding"
                >
                  {brandingMutation.isPending ? "Saving…" : "Save branding"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">API access</CardTitle>
              </div>
              <CardDescription>
                Use this key to push client data into Vayura from your in-house tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Production API key</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    value={revealKey ? apiKey : masked}
                    readOnly
                    className="font-mono text-xs"
                    data-testid="input-api-key"
                  />
                  <Button variant="outline" size="icon" onClick={() => setRevealKey(!revealKey)}>
                    {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Security & access</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <SecurityRow
                title="Single Sign-On (SAML)"
                desc="Let consultants log in via your identity provider."
                action={<Button variant="outline" size="sm">Configure</Button>}
              />
              <SecurityRow
                title="Multi-factor authentication"
                desc="Enforce MFA for every consultant. Currently optional."
                action={<Badge variant="outline">Optional</Badge>}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Plan & billing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md bg-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</span>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="font-semibold text-lg">{formatPlan(tenant?.plan)}</div>
              </div>
              <div className="space-y-2 text-sm">
                <UsageRow label="Active clients" value={String(stats?.activeEngagements ?? 0)} />
                <UsageRow label="Total clients" value={String(stats?.totalClients ?? 0)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sample branded report</DialogTitle>
            <DialogDescription>
              Live PDF using your current form settings and uploaded logo (save branding to persist).
            </DialogDescription>
          </DialogHeader>
          {pdfPreviewUrl ? (
            <iframe title="Branding preview PDF" src={pdfPreviewUrl} className="flex-1 w-full rounded border bg-muted" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityRow({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 border rounded-md">
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      {action}
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

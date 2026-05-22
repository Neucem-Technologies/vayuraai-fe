import { useState } from "react";
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
} from "lucide-react";
import { MOCK_FIRM, MOCK_CLIENTS } from "@/lib/mock-data";

export default function FirmSettings() {
  const [revealKey, setRevealKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(true);

  const apiKey = "vyr_live_a4f2b81c93d45e2710fa8b37c612e9d4";
  const masked = "vyr_live_••••••••••••••••••••••••••••";

  const handleCopy = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <PageHeader
        title="Firm settings"
        subtitle={`Manage ${MOCK_FIRM.name}, your subscription, and consultant-wide preferences`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Firm profile */}
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
                  <Input defaultValue={MOCK_FIRM.name} className="mt-1.5" data-testid="input-firm-name" />
                </div>
                <div>
                  <Label>Display name</Label>
                  <Input defaultValue={MOCK_FIRM.shortName} className="mt-1.5" data-testid="input-firm-display" />
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
                  <Input defaultValue={MOCK_FIRM.website} className="mt-1.5" />
                </div>
                <div className="md:col-span-2">
                  <Label>Registered address</Label>
                  <Input defaultValue="404 Brigade Gateway, Malleshwaram, Bengaluru — 560055" className="mt-1.5" />
                </div>
                <div>
                  <Label>Billing contact</Label>
                  <Input defaultValue={MOCK_FIRM.billingEmail} className="mt-1.5" />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input defaultValue="29AABCG4421R1Z2" className="mt-1.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline">Cancel</Button>
                <Button data-testid="button-save-firm">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Branding / White-label */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Report branding</CardTitle>
              </div>
              <CardDescription>
                Apply your firm's logo and colours to client-facing reports and PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="font-medium text-sm">White-label exports</div>
                  <div className="text-xs text-muted-foreground">Client reports show {MOCK_FIRM.shortName} branding instead of Vayura.</div>
                </div>
                <Button
                  variant={whiteLabel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWhiteLabel(!whiteLabel)}
                  data-testid="button-toggle-whitelabel"
                >
                  {whiteLabel ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Brand colour (HEX)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-9 h-9 rounded border bg-primary" />
                    <Input defaultValue="#1F4D33" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Footer disclaimer (PDF)</Label>
                  <Input defaultValue="Prepared by Greenedge Sustainability Advisors LLP" className="mt-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API & integrations */}
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
                  <Button variant="outline" size="icon" onClick={() => setRevealKey(!revealKey)} data-testid="button-toggle-key">
                    {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopy} data-testid="button-copy-key">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Never share this key publicly. Rotate immediately if it leaks.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" data-testid="button-rotate-key">Rotate key</Button>
                <Button variant="outline" size="sm">View API docs</Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
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
              <SecurityRow
                title="Audit log retention"
                desc="Keep all client data and approval actions for 7 years."
                action={<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>}
              />
              <SecurityRow
                title="Data residency"
                desc="All client data stored in Mumbai (ap-south-1)."
                action={<Badge variant="outline">India</Badge>}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Plan card */}
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
                <div className="font-semibold text-lg">{MOCK_FIRM.plan}</div>
                <div className="text-xs text-muted-foreground mt-1">Renews on 12 May 2026</div>
              </div>

              <div className="space-y-2 text-sm">
                <UsageRow label="Active clients" value={`${MOCK_CLIENTS.filter(c => c.status === "Active").length} / 25`} />
                <UsageRow label="Consultants seats" value="7 / 15" />
                <UsageRow label="Documents this month" value="412 / 5,000" />
                <UsageRow label="Reports generated" value="14 / unlimited" />
              </div>

              <div className="pt-3 border-t space-y-2">
                <Button className="w-full" variant="outline" data-testid="button-upgrade-plan">
                  Upgrade to Enterprise
                </Button>
                <Button className="w-full" variant="ghost" size="sm">
                  View invoices
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Engagement summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement health</CardTitle>
              <CardDescription>Across all active clients this quarter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <HealthRow label="Reports submitted on time" value="12 / 14" status="ok" />
              <HealthRow label="Average review turnaround" value="1.4 days" status="ok" />
              <HealthRow label="Clients with overdue items" value="2" status="warn" />
              <HealthRow label="Net Promoter Score" value="62" status="ok" />
            </CardContent>
          </Card>
        </div>
      </div>
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

function HealthRow({ label, value, status }: { label: string; value: string; status: "ok" | "warn" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${status === "warn" ? "text-amber-600" : "text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Cloud,
  Inbox,
  Sparkles,
  Upload,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-data";
import { useActiveClient } from "@/hooks/use-active-client";
import { formatEmissions } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const SCOPE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: typeof Cloud;
  accent?: "primary" | "amber" | "blue" | "green";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
  } as const;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
              {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </div>
          </div>
          <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0", accentMap[accent ?? "primary"])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="h-72 flex flex-col items-center justify-center text-center px-6 border border-dashed rounded-md bg-muted/20">
      <Cloud className="w-8 h-8 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href="/uploads">Go to uploads</Link>
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats();
  const activeClient = useActiveClient();

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Loading your carbon overview..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </>
    );
  }

  const clientLabel = activeClient?.name ?? "this client";
  const hasEmissions = data.totalEmissionsKg > 0;
  const hasTrend = data.monthlyTrend.some((m) => m.current > 0 || m.previous > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${clientLabel}`}
        actions={
          <Button size="sm" asChild>
            <Link href="/uploads">
              <Upload className="w-4 h-4 mr-2" />
              Upload documents
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total emissions"
          value={formatEmissions(data.totalEmissions)}
          suffix={hasEmissions ? data.emissionsUnit : undefined}
          icon={Cloud}
          accent="primary"
        />
        <KpiCard
          label="Documents uploaded"
          value={String(data.documentsUploaded)}
          icon={Activity}
          accent="blue"
        />
        <KpiCard
          label="Pending review"
          value={String(data.pendingReviews)}
          suffix="documents"
          icon={AlertTriangle}
          accent="amber"
        />
        <KpiCard
          label="Reports generated"
          value={String(data.reportsGenerated)}
          suffix={data.processing > 0 ? `· ${data.processing} processing` : undefined}
          icon={Sparkles}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly emissions trend</CardTitle>
                <CardDescription>tCO2e per month from approved activity</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {hasTrend ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="prev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <ReTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => [`${v.toLocaleString("en-IN")} tCO2e`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Area type="monotone" dataKey="previous" name="Prior year" stroke="hsl(var(--chart-3))" fill="url(#prev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="current" name="Activity year" stroke="hsl(var(--chart-1))" fill="url(#curr)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartPlaceholder
                title="No emissions trend yet"
                description="Upload and approve documents for this client. Monthly charts will appear here after emissions are posted."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emissions by scope</CardTitle>
            <CardDescription>Share of approved inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {data.scopeBreakdown.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.scopeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.scopeBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={SCOPE_COLORS[idx % SCOPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => [`${v.toLocaleString("en-IN")} tCO2e`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {data.scopeBreakdown.map((s, idx) => {
                    const total = data.scopeBreakdown.reduce((acc, x) => acc + x.value, 0);
                    const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCOPE_COLORS[idx] }} />
                          <span className="text-foreground font-medium">{s.name}</span>
                        </div>
                        <span className="text-muted-foreground tabular-nums">
                          {s.value.toLocaleString("en-IN")} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <ChartPlaceholder
                title="No scope breakdown yet"
                description="Scope 1, 2, and 3 splits will show here once approved activity is in the ledger."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top emission sources</CardTitle>
            <CardDescription>Largest contributors (tCO2e)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topSources.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topSources} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={140} />
                    <ReTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => [`${v.toLocaleString("en-IN")} tCO2e`, ""]}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartPlaceholder
                title="No source ranking yet"
                description="After documents are reviewed and emissions are posted, the largest sources will rank here."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ingestion status</CardTitle>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <CardDescription>Updates from your document pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No status updates.</p>
            ) : (
              data.insights.map((ins) => {
                const Icon =
                  ins.severity === "warning" ? AlertTriangle : ins.severity === "success" ? CheckCircle2 : Info;
                const tone =
                  ins.severity === "warning"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : ins.severity === "success"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                return (
                  <div key={ins.id} className="flex gap-3 p-3 rounded-md border bg-card">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", tone)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{ins.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{ins.detail}</div>
                      <div className="text-xs text-muted-foreground/70 mt-1">{ins.timeAgo}</div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent uploads</CardTitle>
              <CardDescription>Latest document activity for {activeClient?.shortName ?? "this client"}</CardDescription>
            </div>
            <Inbox className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {data.activity.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No uploads yet.{" "}
              <Link href="/uploads" className="text-primary font-medium hover:underline">
                Upload your first document
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {data.activity.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between text-sm gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium shrink-0">
                      {a.actor
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{a.actor}</span>
                      <span className="text-muted-foreground"> {a.action} </span>
                      <span className="font-medium text-foreground">{a.target}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.timeAgo}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

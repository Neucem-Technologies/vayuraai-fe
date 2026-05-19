import {
  ArrowDown,
  ArrowUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Cloud,
  TrendingUp,
  FileText,
  Inbox,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-data";
import { useActiveClient } from "@/hooks/use-active-client";
import { cn } from "@/lib/utils";

const SCOPE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

function KpiCard({ label, value, suffix, delta, deltaDir, icon: Icon, accent }: {
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  deltaDir?: "up" | "down" | "neutral";
  icon: any;
  accent?: "primary" | "amber" | "blue";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
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
            {delta && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {deltaDir === "down" && <ArrowDown className="w-3 h-3 text-green-600 dark:text-green-400" />}
                {deltaDir === "up" && <ArrowUp className="w-3 h-3 text-red-600 dark:text-red-400" />}
                <span className={cn(
                  "font-medium",
                  deltaDir === "down" && "text-green-700 dark:text-green-400",
                  deltaDir === "up" && "text-red-700 dark:text-red-400",
                  deltaDir === "neutral" && "text-muted-foreground",
                )}>
                  {delta}
                </span>
                <span className="text-muted-foreground">vs prior year</span>
              </div>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0", accentMap[accent ?? "primary"])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Carbon intelligence overview for FY 2024-25${activeClient ? ` — ${activeClient.name}` : ""}`}
        actions={
          <>
            <Button variant="outline" size="sm">Last 12 months</Button>
            <Button size="sm"><FileText className="w-4 h-4 mr-2" />New report</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total emissions YTD" value={data.totalEmissions.toLocaleString("en-IN")} suffix="tCO2e" delta={`${Math.abs(data.yoyDeltaPct)}%`} deltaDir={data.yoyDeltaPct < 0 ? "down" : "up"} icon={Cloud} accent="primary" />
        <KpiCard label="Active data sources" value={String(data.activeSources)} icon={Activity} accent="blue" delta="2 added" deltaDir="neutral" />
        <KpiCard label="Pending reviews" value={String(data.pendingReviews)} suffix="line items" icon={AlertTriangle} accent="amber" delta="-4 vs last week" deltaDir="down" />
        <KpiCard label="Reports generated" value={String(data.reportsGenerated)} suffix="this year" icon={FileText} accent="primary" delta="+1 this quarter" deltaDir="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly emissions trend</CardTitle>
                <CardDescription>tCO2e per month — current vs prior fiscal year</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
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
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="previous" name="Prior year" stroke="hsl(var(--chart-3))" fill="url(#prev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="current" name="Current year" stroke="hsl(var(--chart-1))" fill="url(#curr)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emissions by scope</CardTitle>
            <CardDescription>Share of total YTD emissions</CardDescription>
          </CardHeader>
          <CardContent>
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
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v.toLocaleString()} tCO2e`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {data.scopeBreakdown.map((s, idx) => {
                const total = data.scopeBreakdown.reduce((acc, x) => acc + x.value, 0);
                const pct = ((s.value / total) * 100).toFixed(1);
                return (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCOPE_COLORS[idx] }} />
                      <span className="text-foreground font-medium">{s.name}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{s.value.toFixed(1)} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 emission sources</CardTitle>
            <CardDescription>Largest contributors this year (tCO2e)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSources} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={210} />
                  <ReTooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v.toLocaleString()} tCO2e`, ""]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI insights</CardTitle>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <CardDescription>Anomalies and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.map((ins) => {
              const Icon = ins.severity === "warning" ? AlertTriangle : ins.severity === "success" ? CheckCircle2 : Info;
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
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest changes across your workspace</CardDescription>
            </div>
            <Inbox className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data.activity.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between text-sm gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium shrink-0">
                    {a.actor.split(" ").map((p) => p[0]).join("").slice(0,2)}
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
        </CardContent>
      </Card>
    </>
  );
}

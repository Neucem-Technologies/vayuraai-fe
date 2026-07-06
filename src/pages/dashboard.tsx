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
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-data";
import { useActiveClient } from "@/hooks/use-active-client";
import { formatEmissions } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

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
          label="Total emissions YTD"
          value={formatEmissions(data.totalEmissions)}
          suffix={data.totalEmissions > 0 ? "tCO2e" : undefined}
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
          label="Processing"
          value={String(data.processing)}
          suffix={data.completed > 0 ? `· ${data.completed} done` : undefined}
          icon={Loader2}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly emissions trend</CardTitle>
            <CardDescription>tCO2e per month — available once activity data is calculated</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title="No emissions trend yet"
              description="Upload and process documents for this client. Monthly charts will appear here after emissions are calculated."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emissions by scope</CardTitle>
            <CardDescription>Share of total YTD emissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              title="No scope breakdown yet"
              description="Scope 1, 2, and 3 splits will show here once ingested data is converted to emissions."
            />
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
            <ChartPlaceholder
              title="No source ranking yet"
              description="After documents are reviewed and emissions are computed, the largest sources will rank here."
            />
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

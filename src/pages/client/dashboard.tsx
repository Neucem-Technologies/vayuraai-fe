import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClientDashboard } from "@/lib/client-api";
import { useAuthStore } from "@/hooks/use-auth";

function formatKg(kg: number): string {
  if (kg === 0) return "—";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(0)} kg`;
}

export default function ClientDashboard() {
  const orgId = useAuthStore((s) => s.access?.orgId ?? s.access?.allowedOrgIds?.[0] ?? null);
  const { data, isLoading } = useQuery({
    queryKey: ["client-dashboard", orgId],
    queryFn: fetchClientDashboard,
    enabled: !!orgId,
  });

  return (
    <div>
      <PageHeader
        title="Emissions overview"
        subtitle={
          data
            ? `${data.organisation.legalName} · ${data.emissions.period}`
            : "Your organisation's carbon summary"
        }
      />
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scope 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatKg(data?.emissions.scope1Kg ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scope 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatKg(data?.emissions.scope2Kg ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scope 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatKg(data?.emissions.scope3Kg ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
            </CardContent>
          </Card>
        </div>
      )}
      <p className="text-sm text-muted-foreground mt-6">
        Detailed activity data and uploads are managed by your sustainability advisor. Report downloads are
        available under Reports.
      </p>
    </div>
  );
}

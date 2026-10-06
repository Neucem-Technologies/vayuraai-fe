import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchClientDashboard } from "@/lib/client-api";
import { useAuthStore } from "@/hooks/use-auth";
import type { ClientDashboardPeriod } from "@vayura/api-contracts/client";

function formatKg(kg: number): string {
  if (kg === 0) return "—";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(0)} kg`;
}

function formatIntensity(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} t ${unit}`;
  return `${value.toFixed(1)} kg ${unit}`;
}

export default function ClientDashboard() {
  const orgId = useAuthStore((s) => s.access?.orgId ?? s.access?.allowedOrgIds?.[0] ?? null);
  const [period, setPeriod] = useState<ClientDashboardPeriod>("fy");
  const [year, setYear] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["client-dashboard", orgId, period, year],
    queryFn: () => fetchClientDashboard({ period, year: year ?? undefined }),
    enabled: !!orgId,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  const years = data?.fyStartYears ?? [];
  const selectedYear = year ?? data?.fyStartYear;

  return (
    <div>
      <PageHeader
        title="Emissions overview"
        subtitle={
          data
            ? `${data.organisation.legalName} · ${data.emissions.period}`
            : "Your organisation's carbon summary"
        }
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as ClientDashboardPeriod)}>
              <SelectTrigger className="w-[140px]" data-testid="select-client-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fy">Full year</SelectItem>
                <SelectItem value="q1">Q1 (Apr–Jun)</SelectItem>
                <SelectItem value="q2">Q2 (Jul–Sep)</SelectItem>
                <SelectItem value="q3">Q3 (Oct–Dec)</SelectItem>
                <SelectItem value="q4">Q4 (Jan–Mar)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedYear ? String(selectedYear) : undefined}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-[140px]" data-testid="select-client-fy">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((fy) => (
                  <SelectItem key={fy} value={String(fy)}>
                    FY {fy}–{String(fy + 1).slice(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      {data?.consultantFirmName && (
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Prepared with {data.consultantFirmName}</p>
      )}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
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
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Intensity per employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatIntensity(data?.intensity.kgPerEmployee ?? null, "/ employee")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.intensity.employeeCount
                    ? `${data.intensity.employeeCount.toLocaleString("en-IN")} employees on the organisation profile`
                    : "Add an employee count on the organisation profile to calculate this."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Intensity per ₹ crore turnover</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatIntensity(data?.intensity.kgPerCroreInr ?? null, "/ ₹ crore")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.intensity.annualTurnoverInr
                    ? `Turnover ₹ ${data.intensity.annualTurnoverInr.toLocaleString("en-IN")}`
                    : "Add annual turnover on the organisation profile to calculate this."}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground mt-6">
        Detailed activity data and uploads are managed by your sustainability advisor. Report downloads are
        available under Reports.
      </p>
    </div>
  );
}

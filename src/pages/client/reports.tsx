import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchClientReports } from "@/lib/client-api";
import { downloadClientReportPdf } from "@/lib/reports-api";
import { useAuthStore } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function ClientReports() {
  const orgId = useAuthStore((s) => s.access?.orgId ?? s.access?.allowedOrgIds?.[0] ?? null);
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["client-reports", orgId],
    queryFn: fetchClientReports,
    enabled: !!orgId,
  });

  const onDownload = async (id: string, name: string) => {
    try {
      await downloadClientReportPdf(id, name);
    } catch (e) {
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Download disclosure reports prepared for your organisation" />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading reports…</p>
          ) : reports.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No reports are available yet. Your advisor will publish reports here when they are ready.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                    <TableCell>{r.generatedAt ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDownload(r.id, r.name)}
                      >
                        <Download className="w-4 h-4 mr-1" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

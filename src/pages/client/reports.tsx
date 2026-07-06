import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchClientReports } from "@/lib/client-api";

export default function ClientReports() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["client-reports"],
    queryFn: fetchClientReports,
  });

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.generatedAt ?? "—"}</TableCell>
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

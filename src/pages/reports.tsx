import { useState } from "react";
import {
  FileText,
  Download,
  Plus,
  Eye,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReports } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "brsr",
    name: "BRSR Core",
    standard: "BRSR",
    description: "SEBI Business Responsibility & Sustainability Report — Section A through E with all NGRBC principles.",
    sections: 9,
  },
  {
    id: "gri",
    name: "GRI Standards 2021",
    standard: "GRI",
    description: "Universal, sector-specific, and topic-specific disclosures aligned to GRI 2021.",
    sections: 12,
  },
  {
    id: "ghg",
    name: "GHG Protocol Inventory",
    standard: "GHG",
    description: "Comprehensive Scope 1, 2, and 3 inventory with optional market vs. location-based reporting.",
    sections: 6,
  },
];

export default function Reports() {
  const { data: reports, isLoading } = useReports();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<string>("brsr");

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate, manage, and submit audit-ready disclosures aligned to BRSR, GRI, and the GHG Protocol."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New report
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {TEMPLATES.map((t) => (
          <Card key={t.id} className="hover-elevate cursor-pointer" onClick={() => { setTemplate(t.id); setOpen(true); }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">{t.standard}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{t.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t.sections} sections</span>
                <span className="flex items-center gap-1 text-primary font-medium">Generate <ChevronRight className="w-3 h-3" /></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
          <CardDescription>Drafts, finalized, and submitted reports across reporting periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Total emissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && reports?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                          r.status === "Submitted" ? "bg-green-500/10 text-green-600 dark:text-green-400" : r.status === "Final" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground",
                        )}>
                          {r.status === "Submitted" ? <CheckCircle2 className="w-4 h-4" /> : r.status === "Final" ? <FileText className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{r.name}</div>
                          <div className="text-xs text-muted-foreground">by {r.generatedBy}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground font-medium">{r.standard}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.period}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.generatedOn}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">
                      {r.totalEmissions.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                      <span className="text-xs text-muted-foreground ml-1">tCO2e</span>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate new report</DialogTitle>
            <DialogDescription>
              Pick a template and reporting period. We'll roll up your approved emissions automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.standard})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">From</Label>
                <Input type="date" defaultValue="2024-04-01" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">To</Label>
                <Input type="date" defaultValue="2025-03-31" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Reporting boundary</Label>
              <Select defaultValue="all">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All facilities (operational control)</SelectItem>
                  <SelectItem value="india">India operations only</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Estimated generation time: 2-3 minutes. You'll be notified when the report is ready.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>
              <FileText className="w-4 h-4 mr-2" /> Start generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

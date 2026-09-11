import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_ROWS = 200;
const MAX_COLS = 40;

type SheetData = {
  name: string;
  rows: string[][];
  truncated: boolean;
  totalRows: number;
};

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function parseWorkbook(buffer: ArrayBuffer): SheetData[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });
    const totalRows = matrix.length;
    const sliced = matrix.slice(0, MAX_ROWS).map((row) => {
      const cells = Array.isArray(row) ? row : [];
      return cells.slice(0, MAX_COLS).map(cellText);
    });
    const width = Math.max(1, ...sliced.map((r) => r.length), 1);
    const rows = sliced.map((r) => {
      const padded = [...r];
      while (padded.length < width) padded.push("");
      return padded;
    });
    return {
      name,
      rows,
      totalRows,
      truncated: totalRows > MAX_ROWS || matrix.some((r) => Array.isArray(r) && r.length > MAX_COLS),
    };
  });
}

type Props = {
  blob: Blob;
  filename: string;
};

export function SpreadsheetPreview({ blob, filename }: Props) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [active, setActive] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSheets([]);
    setActive("");

    void (async () => {
      try {
        const buffer = await blob.arrayBuffer();
        if (cancelled) return;
        const parsed = parseWorkbook(buffer);
        setSheets(parsed);
        setActive(parsed[0]?.name ?? "");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not parse spreadsheet.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob]);

  const current = useMemo(
    () => sheets.find((s) => s.name === active) ?? sheets[0],
    [sheets, active],
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Parsing {filename}…
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {error ?? "No sheets found in this file."}
      </div>
    );
  }

  const colCount = current.rows[0]?.length ?? 0;
  const header = current.rows[0] ?? [];
  const body = current.rows.slice(1);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-background shrink-0">
        {sheets.length > 1 ? (
          <Tabs value={current.name} onValueChange={setActive}>
            <TabsList className="h-8">
              {sheets.map((s) => (
                <TabsTrigger key={s.name} value={s.name} className="text-xs px-2.5">
                  {s.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <span className="text-xs text-muted-foreground">{current.name}</span>
        )}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {current.truncated
            ? `Showing first ${MAX_ROWS} of ${current.totalRows} rows`
            : `${Math.max(0, current.totalRows - 1)} data rows`}
          {colCount > 0 ? ` · ${colCount} cols` : ""}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 sticky left-0 bg-muted/80 text-center text-xs text-muted-foreground">
                #
              </TableHead>
              {header.map((cell, i) => (
                <TableHead key={i} className="whitespace-nowrap text-xs font-medium">
                  {cell || `Col ${i + 1}`}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {body.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount + 1} className="text-center text-muted-foreground text-sm py-8">
                  Sheet is empty
                </TableCell>
              </TableRow>
            ) : (
              body.map((row, ri) => (
                <TableRow key={ri}>
                  <TableCell className="sticky left-0 bg-background text-center text-xs text-muted-foreground tabular-nums">
                    {ri + 2}
                  </TableCell>
                  {row.map((cell, ci) => (
                    <TableCell key={ci} className="whitespace-nowrap text-xs tabular-nums max-w-[240px] truncate">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Detect Excel / CSV by MIME or filename when content-type is generic. */
export function isSpreadsheetFile(mimeType: string, filename: string): boolean {
  const mime = mimeType.toLowerCase().split(";")[0].trim();
  const name = filename.toLowerCase();

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime === "text/csv" ||
    mime === "application/csv" ||
    mime === "text/tab-separated-values"
  ) {
    return true;
  }

  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    name.endsWith(".tsv")
  );
}

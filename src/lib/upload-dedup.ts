import type { UploadStatus } from '@/lib/mock-data';

/** Maps UI status to backend ingestion states that block duplicate filenames. */
const BLOCKING_UI_STATUSES: UploadStatus[] = ['Processing', 'Needs Review'];

export function normalizeUploadFilename(filename: string): string {
  return filename.trim().toLowerCase();
}

export function dedupeFilesInBatch(files: File[]): { files: File[]; skipped: string[] } {
  const seen = new Set<string>();
  const unique: File[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const key = normalizeUploadFilename(file.name);
    if (seen.has(key)) {
      skipped.push(file.name);
      continue;
    }
    seen.add(key);
    unique.push(file);
  }

  return { files: unique, skipped };
}

export function findBlockingFilenameConflicts(
  files: File[],
  existingUploads: { filename: string; status: UploadStatus }[],
): string[] {
  const activeNames = new Set(
    existingUploads
      .filter((u) => BLOCKING_UI_STATUSES.includes(u.status))
      .map((u) => normalizeUploadFilename(u.filename)),
  );

  const conflicts: string[] = [];
  for (const file of files) {
    const key = normalizeUploadFilename(file.name);
    if (activeNames.has(key) && !conflicts.includes(file.name)) {
      conflicts.push(file.name);
    }
  }
  return conflicts;
}

export function findCompletedFilenameMatches(
  files: File[],
  existingUploads: { filename: string; status: UploadStatus }[],
): string[] {
  const completedNames = new Set(
    existingUploads
      .filter((u) => u.status === 'Completed')
      .map((u) => normalizeUploadFilename(u.filename)),
  );

  const matches: string[] = [];
  for (const file of files) {
    const key = normalizeUploadFilename(file.name);
    if (completedNames.has(key) && !matches.includes(file.name)) {
      matches.push(file.name);
    }
  }
  return matches;
}

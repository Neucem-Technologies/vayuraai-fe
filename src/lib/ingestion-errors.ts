/** Hide raw backend/Prisma errors from ingestion toasts and banners. */
export function friendlyIngestionError(message: string | null | undefined): string {
  if (!message?.trim()) {
    return 'Document processing could not be completed. Please try uploading again.';
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('prisma') ||
    lower.includes('invocation') ||
    lower.includes('.ts:') ||
    lower.includes('p2002') ||
    lower.includes('column') && lower.includes('does not exist')
  ) {
    return 'Document processing could not be completed. Please try again or contact your administrator.';
  }

  return message;
}

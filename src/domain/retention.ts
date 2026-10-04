// Stored PDFs are deleted this long after they're made. The Typst source stays
// with the application, so the PDF can be rebuilt on demand without storing it.
export const PDF_RETENTION_MS = 24 * 60 * 60 * 1000;

export function pdfExpiryCutoff(now: Date): Date {
  return new Date(now.getTime() - PDF_RETENTION_MS);
}

export function isPdfExpired(createdAt: Date | null, now: Date): boolean {
  return !createdAt || createdAt <= pdfExpiryCutoff(now);
}

/** Public technique sequence payload URL (D1-backed GET /api/techniques?id=…). */
export function techniqueSequenceApiUrl(slugOrId: string): string {
  return `/api/techniques?id=${encodeURIComponent(slugOrId)}`;
}

// A case-insensitive "contains" pattern for ILIKE. LIKE's own wildcards are escaped,
// so "%" or "_" in a search only match themselves.
export function containsPattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

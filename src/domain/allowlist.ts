// ALLOWED_EMAILS is a comma-separated list. Matching ignores case and spaces.
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined, allowlist: string[]): boolean {
  if (!email) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

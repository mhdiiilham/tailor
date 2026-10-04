// ALLOWED_EMAILS is a comma-separated list. Matching ignores case and spaces.
// "*" lets any Google account sign in. An empty list lets nobody in, so a
// missing setting can never open the app by accident.
export const ANYONE = "*";

export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined, allowlist: string[]): boolean {
  if (!email) return false;
  return allowlist.includes(ANYONE) || allowlist.includes(email.trim().toLowerCase());
}

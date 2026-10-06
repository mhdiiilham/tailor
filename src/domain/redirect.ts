// Where to go after signing in, from a ?next= parameter. Only a path on this site is
// allowed ("/new?hn=1"), never another origin ("//evil.com", "https://..."), so it
// can't be used to send people elsewhere after a real Google sign-in.
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 300) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

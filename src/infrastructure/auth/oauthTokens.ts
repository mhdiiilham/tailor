// Tailor only uses Google to confirm who someone is. It never calls Google APIs on
// their behalf, so the OAuth tokens Google hands back are dropped instead of stored:
// a leaked database then holds nothing that works against anyone's Google account.
const TOKEN_FIELDS = [
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
] as const;

type TokenFields = { [K in (typeof TOKEN_FIELDS)[number]]: null };

export function withoutOAuthTokens<T extends object>(account: T): Omit<T, keyof TokenFields> & TokenFields {
  const nulls = Object.fromEntries(TOKEN_FIELDS.map((f) => [f, null])) as TokenFields;
  return { ...account, ...nulls };
}

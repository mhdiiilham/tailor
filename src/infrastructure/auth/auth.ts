import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { isAllowed, parseAllowlist } from "@/domain/allowlist";
import { getDb } from "@/infrastructure/db/instance";
import * as schema from "@/infrastructure/db/schema";
import { withoutOAuthTokens } from "./oauthTokens";

export const allowlist = () => parseAllowlist(process.env.ALLOWED_EMAILS);

function createAuth() {
  return betterAuth({
    // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        prompt: "select_account",
      },
    },
    // Google tokens are never needed after sign-in, so they're neither refreshed nor kept.
    account: { updateAccountOnSignIn: false },
    databaseHooks: {
      user: {
        create: {
          // Only emails in ALLOWED_EMAILS (or anyone, with "*") get an account.
          before: async (user) => isAllowed(user.email, allowlist()),
        },
      },
      account: {
        create: { before: async (account) => ({ data: withoutOAuthTokens(account) }) },
        update: { before: async (account) => ({ data: withoutOAuthTokens(account) }) },
      },
    },
    plugins: [nextCookies()],
  });
}

// Created on first use so `next build` never opens the database.
const g = globalThis as unknown as { __auth?: ReturnType<typeof createAuth> };

export function getAuth() {
  g.__auth ??= createAuth();
  return g.__auth;
}

import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowed } from "@/domain/allowlist";
import { allowlist, getAuth } from "./auth";

export type CurrentUser = { id: string; name: string; email: string; image: string | null };

// The real access check. Also re-checks the allowlist, so removing an email
// locks that person out even if they still have a session.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Read headers first: during `next build` this marks the page dynamic before
  // Better Auth is created (it refuses to start without BETTER_AUTH_SECRET).
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session || !isAllowed(session.user.email, allowlist())) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

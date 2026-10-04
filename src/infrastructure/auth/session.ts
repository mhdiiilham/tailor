import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowed } from "@/domain/allowlist";
import { allowlist, getAuth } from "./auth";

export type CurrentUser = { id: string; name: string; email: string; image: string | null };

// The real access check. Also re-checks the allowlist, so removing an email
// locks that person out even if they still have a session.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !isAllowed(session.user.email, allowlist())) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

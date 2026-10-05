"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { NoProfileError, NotFoundError } from "@/application/applications";
import { accountRepository, applicationRecords, applicationServiceFor, profileRepository } from "@/container";
import { getAuth } from "@/infrastructure/auth/auth";
import { requireUser } from "@/infrastructure/auth/session";
import { parseProfileYaml } from "@/infrastructure/profileYaml";
import { StageSchema } from "@/domain/stage";

export type ActionState = { error?: string; notice?: string };

const KNOWN_ERRORS = [NoProfileError, NotFoundError];

// Turns any failure into text for the page. These actions never receive the Gemini key:
// the browser calls Google itself and only sends the results here.
function describe(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("\n");
  }
  if (KNOWN_ERRORS.some((E) => err instanceof E)) return (err as Error).message;
  console.error("[action]", err instanceof Error ? (err.stack ?? err.message) : String(err));
  return err instanceof Error ? err.message : "Something went wrong.";
}

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await profileRepository().saveForUser(user.id, parseProfileYaml(field(form, "yaml")));
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return { notice: "Saved." };
}

// The save actions below take the results of the AI steps the browser ran (see
// application/workflows.ts). ApplicationService validates everything before saving.

// Returns the new id; the browser navigates to it.
export async function createApplication(analysis: unknown): Promise<ActionState & { id?: number }> {
  const user = await requireUser();
  try {
    return { id: (await applicationServiceFor(user.id).create(analysis)).id };
  } catch (err) {
    return { error: describe(err) };
  }
}

export async function saveResume(id: number, input: unknown): Promise<ActionState> {
  const user = await requireUser();
  try {
    await applicationServiceFor(user.id).saveResume(id, input);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return {};
}

export async function deleteApplication(id: number): Promise<ActionState> {
  const user = await requireUser();
  try {
    if (!(await applicationRecords().delete(user.id, id))) return { error: "That application no longer exists." };
  } catch (err) {
    return { error: describe(err) };
  }
  redirect("/");
}

// Removes the account and, through cascades, the profile and every application.
export async function deleteAccount(): Promise<ActionState> {
  const user = await requireUser();
  try {
    // Sign out first so the session cookie is cleared along with the session.
    await getAuth().api.signOut({ headers: await headers() });
    await accountRepository().deleteUser(user.id);
  } catch (err) {
    return { error: describe(err) };
  }
  return { notice: "Your account and all its data are deleted." };
}

export async function setApplicationStage(id: number, stage: string): Promise<ActionState> {
  const user = await requireUser();
  const parsed = StageSchema.safeParse(stage);
  if (!parsed.success) return { error: "Unknown stage." };
  try {
    if (!(await applicationRecords().setStage(user.id, id, parsed.data))) {
      return { error: "That application no longer exists." };
    }
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return {};
}

export async function saveCoverLetter(id: number, text: unknown): Promise<ActionState> {
  const user = await requireUser();
  try {
    await applicationServiceFor(user.id).saveCoverLetter(id, text);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return {};
}

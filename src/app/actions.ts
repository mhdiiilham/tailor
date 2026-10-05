"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { ZodError } from "zod";
import { NoProfileError, NotFoundError } from "@/application/applications";
import { accountRepository, applicationRecords, applicationServiceFor, profileRepository } from "@/container";
import { getAuth } from "@/infrastructure/auth/auth";
import { requireUser } from "@/infrastructure/auth/session";
import { parseProfileYaml } from "@/infrastructure/profileYaml";
import { parseStageFilter, StageSchema } from "@/domain/stage";
import { loadRowPage } from "./dashboard/load";
import type { RowPage } from "./dashboard/rows";

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

// A job added by hand, only to track it. Returns the new id; the browser opens it.
export async function trackApplication(input: unknown): Promise<ActionState & { id?: number }> {
  const user = await requireUser();
  try {
    return { id: (await applicationServiceFor(user.id).track(input)).id };
  } catch (err) {
    return { error: describe(err) };
  }
}

// The browser analyzed the job description pasted into a tracked job.
export async function analyzeTrackedApplication(id: number, analysis: unknown): Promise<ActionState> {
  const user = await requireUser();
  try {
    await applicationServiceFor(user.id).analyzeTracked(id, analysis);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return {};
}

export async function saveApplicationNotes(id: number, notes: unknown): Promise<ActionState> {
  const user = await requireUser();
  try {
    await applicationServiceFor(user.id).saveNotes(id, { notes });
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return { notice: "Saved." };
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

// The caller decides what happens next: the list drops the row, the application page goes home.
export async function deleteApplication(id: number): Promise<ActionState> {
  const user = await requireUser();
  try {
    if (!(await applicationRecords().delete(user.id, id))) return { error: "That application no longer exists." };
  } catch (err) {
    return { error: describe(err) };
  }
  return {};
}

// "Load more" on the applications list. Every input comes from the browser, so it's checked here.
export async function loadApplications(input: {
  stage: unknown;
  search: unknown;
  cursor: unknown;
}): Promise<RowPage & ActionState> {
  const user = await requireUser();
  const cursor = Number(input.cursor);
  if (!Number.isInteger(cursor) || cursor < 1) return { rows: [], nextCursor: null, error: "Invalid page." };
  const search = typeof input.search === "string" ? input.search.slice(0, 200) : "";
  try {
    return await loadRowPage(user.id, parseStageFilter(input.stage), search, cursor);
  } catch (err) {
    return { rows: [], nextCursor: null, error: describe(err) };
  }
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

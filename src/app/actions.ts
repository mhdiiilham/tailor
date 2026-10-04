"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { NoProfileError, NotFoundError } from "@/application/applications";
import { InvalidApiKeyError, MissingApiKeyError, RateLimitedError, scrubSecret } from "@/domain/errors";
import {
  accountRepository,
  applicationRecords,
  applicationServiceFor,
  geminiFor,
  profileRepository,
} from "@/container";
import { getAuth } from "@/infrastructure/auth/auth";
import { requireUser } from "@/infrastructure/auth/session";
import { parseProfileYaml } from "@/infrastructure/profileYaml";
import { StageSchema } from "@/domain/stage";

export type ActionState = { error?: string; notice?: string };

const KNOWN_ERRORS = [NoProfileError, NotFoundError, MissingApiKeyError, InvalidApiKeyError, RateLimitedError];

// Turns any failure into text for the page. The Gemini key is scrubbed from
// everything, so it can't leak through an error message or the server log.
function describe(err: unknown, geminiKey?: string): string {
  let message: string;
  if (err instanceof ZodError) {
    message = err.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("\n");
  } else if (KNOWN_ERRORS.some((E) => err instanceof E)) {
    message = (err as Error).message;
  } else {
    console.error("[action]", scrubSecret(err instanceof Error ? (err.stack ?? err.message) : String(err), geminiKey));
    message = err instanceof Error ? err.message : "Something went wrong.";
  }
  return scrubSecret(message, geminiKey);
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

const MIN_JD_LENGTH = 200;

export async function startApplication(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const jd = field(form, "jd");
  const key = field(form, "geminiKey");
  if (jd.length < MIN_JD_LENGTH) {
    return { error: "That looks too short for a job description. Paste the whole posting." };
  }
  let id: number;
  try {
    id = (await applicationServiceFor(user.id, key).start(jd)).id;
  } catch (err) {
    return { error: describe(err, key) };
  }
  redirect(`/applications/${id}`);
}

export async function generateResume(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const key = field(form, "geminiKey");
  const answers: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (name.startsWith("q:")) answers[name.slice(2)] = String(value);
  }
  try {
    await applicationServiceFor(user.id, key).generate(id, answers);
  } catch (err) {
    return { error: describe(err, key) };
  }
  refresh();
  return {};
}

export async function reviseResume(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const key = field(form, "geminiKey");
  const feedback = field(form, "feedback");
  if (!feedback) return { error: "Say what you want changed." };
  try {
    await applicationServiceFor(user.id, key).revise(id, feedback);
  } catch (err) {
    return { error: describe(err, key) };
  }
  refresh();
  return { notice: "Updated." };
}

// Checks a key with one tiny call. Nothing is stored on the server.
export async function testGeminiKey(key: string): Promise<ActionState> {
  await requireUser();
  try {
    await geminiFor(key).ping();
  } catch (err) {
    return { error: describe(err, key) };
  }
  return { notice: "Key works." };
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

export async function writeCoverLetter(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const key = field(form, "geminiKey");
  try {
    await applicationServiceFor(user.id, key).writeCoverLetter(id);
  } catch (err) {
    return { error: describe(err, key) };
  }
  refresh();
  return {};
}

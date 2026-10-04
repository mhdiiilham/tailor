"use server";

import { readFile } from "node:fs/promises";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { NoProfileError, NotFoundError } from "@/application/applications";
import { applicationService, paths, profileRepository } from "@/container";
import { parseProfileYaml } from "@/infrastructure/profileYaml";

export type ActionState = { error?: string; notice?: string };

function describe(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("\n");
  }
  if (err instanceof NoProfileError || err instanceof NotFoundError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export async function importProfileYaml(): Promise<ActionState> {
  try {
    const profile = parseProfileYaml(await readFile(paths.profileYaml, "utf8"));
    await profileRepository().saveDefault(profile);
  } catch (err) {
    return { error: `Couldn't import ${paths.profileYaml}.\n${describe(err)}` };
  }
  refresh();
  return { notice: "Imported profile.yaml." };
}

export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const profile = parseProfileYaml(String(form.get("yaml") ?? ""));
    await profileRepository().saveDefault(profile);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return { notice: "Saved." };
}

const MIN_JD_LENGTH = 200;

export async function startApplication(_prev: ActionState, form: FormData): Promise<ActionState> {
  const jd = String(form.get("jd") ?? "").trim();
  if (jd.length < MIN_JD_LENGTH) {
    return { error: "That looks too short for a job description. Paste the whole posting." };
  }
  let id: number;
  try {
    id = (await applicationService().start(jd)).id;
  } catch (err) {
    return { error: describe(err) };
  }
  redirect(`/applications/${id}`);
}

export async function generateResume(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const answers: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("q:")) answers[key.slice(2)] = String(value);
  }
  try {
    await applicationService().generate(id, answers);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return {};
}

export async function reviseResume(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const feedback = String(form.get("feedback") ?? "").trim();
  if (!feedback) return { error: "Say what you want changed." };
  try {
    await applicationService().revise(id, feedback);
  } catch (err) {
    return { error: describe(err) };
  }
  refresh();
  return { notice: "Updated." };
}

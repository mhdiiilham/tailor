import type { z } from "zod";
import type { Application, NewApplication } from "./application";
import type { Profile } from "./profile";
import type { TailoredResume } from "./resume";

// "fast" is for extraction and analysis, "write" for the resume itself.
// Each tier can point at a different (cheaper or better) model.
export type ModelTier = "fast" | "write";

export type GenerateObjectRequest<T> = {
  tier: ModelTier;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
};

export interface LlmPort {
  generateObject<T>(req: GenerateObjectRequest<T>): Promise<T>;
}

export type StoredProfile = { profile: Profile; updatedAt: Date };

// Every method is scoped to one user; another user's data is never visible.
export interface ProfileRepository {
  findByUser(userId: string): Promise<StoredProfile | null>;
  saveForUser(userId: string, profile: Profile): Promise<StoredProfile>;
}

export interface ApplicationRepository {
  create(app: NewApplication): Promise<Application>;
  findById(userId: string, id: number): Promise<Application | null>;
  list(userId: string): Promise<Application[]>;
  update(userId: string, id: number, patch: Partial<Omit<NewApplication, "userId">>): Promise<Application>;
}

export type RenderedResume = { typSource: string; pdf: Buffer };

export interface ResumeRenderer {
  render(input: { profile: Profile; resume: TailoredResume }): Promise<RenderedResume>;
}

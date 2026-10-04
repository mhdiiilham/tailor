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

export type StoredProfile = { id: number; profile: Profile; updatedAt: Date };

export interface ProfileRepository {
  findDefault(): Promise<StoredProfile | null>;
  saveDefault(profile: Profile): Promise<StoredProfile>;
}

export interface ApplicationRepository {
  create(app: NewApplication): Promise<Application>;
  findById(id: number): Promise<Application | null>;
  list(): Promise<Application[]>;
  update(id: number, patch: Partial<NewApplication>): Promise<Application>;
}

export type RenderedResume = { typPath: string; pdfPath: string };

export interface ResumeRenderer {
  render(input: {
    profile: Profile;
    resume: TailoredResume;
    company: string;
    role: string;
  }): Promise<RenderedResume>;
}

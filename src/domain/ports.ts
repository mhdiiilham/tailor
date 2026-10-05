import type { z } from "zod";
import type { Application, ApplicationPage, ApplicationPageQuery, NewApplication, StageStats } from "./application";
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
  listPage(userId: string, query: ApplicationPageQuery): Promise<ApplicationPage>;
  stageStats(userId: string): Promise<StageStats[]>;
  update(userId: string, id: number, patch: Partial<Omit<NewApplication, "userId">>): Promise<Application>;
  delete(userId: string, id: number): Promise<boolean>;
  // Drops stored PDFs made before the cutoff, for every user. Returns how many.
  purgePdfsCreatedBefore(cutoff: Date): Promise<number>;
}

export interface AccountRepository {
  // Removes the user and, through cascades, their sessions, profile and applications.
  deleteUser(userId: string): Promise<void>;
}

export type RenderedResume = { typSource: string; pdf: Buffer };

export interface ResumeRenderer {
  render(input: { profile: Profile; resume: TailoredResume }): Promise<RenderedResume>;
  compile(typSource: string): Promise<Buffer>;
  // PNG images of each page, for showing the resume on screen.
  previewPages(typSource: string): Promise<Buffer[]>;
}

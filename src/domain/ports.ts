import type { z } from "zod";
import type { Application, ApplicationPage, ApplicationPageQuery, NewApplication, StageStats } from "./application";
import type { HnJob, HnPost, HnPostPage, HnPostQuery } from "./hn";
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
  // Lower for judging (same input, same answer), left unset for writing.
  temperature?: number;
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

export type HnThread = { id: number; title: string; postedAt: Date };

// The stored "Who is hiring?" threads and posts. Shared by all users (public HN data).
export interface HnRepository {
  saveThread(thread: HnThread): Promise<void>;
  latestThread(): Promise<HnThread | null>;
  listThreads(): Promise<HnThread[]>;
  markChecked(threadId: number, at: Date): Promise<void>;
  postIds(threadId: number): Promise<number[]>;
  addPosts(posts: Omit<HnPost, "job">[]): Promise<void>;
  unparsed(limit: number): Promise<{ id: number; text: string }[]>;
  saveParsed(results: { id: number; job: HnJob }[], at: Date): Promise<void>;
  listPosts(threadId: number, query: HnPostQuery): Promise<HnPostPage>;
  findPost(id: number): Promise<HnPost | null>;
  // Per-user bookmarks, across every month.
  savePost(userId: string, postId: number, at: Date): Promise<void>;
  unsavePost(userId: string, postId: number): Promise<void>;
  savedIds(userId: string, postIds: number[]): Promise<number[]>;
  savedCount(userId: string): Promise<number>;
  listSaved(userId: string, query: HnPostQuery): Promise<HnPostPage>;
}

// Raw items from the Hacker News API (https://github.com/HackerNews/API).
export type HnItem = {
  id: number;
  type?: string;
  by?: string;
  time?: number;
  title?: string;
  text?: string;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
};

export interface HnClient {
  item(id: number): Promise<HnItem | null>;
  submissions(user: string): Promise<number[]>;
}

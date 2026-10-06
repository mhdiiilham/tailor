import { boolean, customType, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { FitAnalysis } from "@/domain/fit";
import type { HnJob } from "@/domain/hn";
import type { JobPosting } from "@/domain/job";
import type { Profile } from "@/domain/profile";
import type { Answers, Question } from "@/domain/questions";
import type { TailoredResume } from "@/domain/resume";
import { STAGES } from "@/domain/stage";

// Drizzle has no built-in bytea column; PDFs are stored as raw bytes.
const bytea = customType<{ data: Buffer; driverData: Uint8Array }>({
  dataType: () => "bytea",
  // node-postgres returns a Buffer, PGlite a Uint8Array; normalize to Buffer.
  fromDriver: (value) => Buffer.from(value),
});

const ts = (name: string) => timestamp(name, { withTimezone: true });

// Better Auth core tables. Field names match what its Drizzle adapter expects.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  refreshTokenExpiresAt: ts("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

// App tables. Whole domain documents live in jsonb columns.
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Profile>().notNull(),
  updatedAt: ts("updated_at").notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jdText: text("jd_text").notNull(),
  job: jsonb("job").$type<JobPosting>().notNull(),
  // Null for a job the person only tracks (no job description analyzed yet).
  fit: jsonb("fit").$type<FitAnalysis>(),
  questions: jsonb("questions").$type<Question[]>().notNull(),
  answers: jsonb("answers").$type<Answers>(),
  resume: jsonb("resume").$type<TailoredResume>(),
  typSource: text("typ_source"),
  pdf: bytea("pdf"),
  // When the stored PDF was made; it's deleted after PDF_RETENTION_MS.
  pdfCreatedAt: ts("pdf_created_at"),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  status: text("status", { enum: ["tracked", "questions", "generated"] }).notNull(),
  stage: text("stage", { enum: STAGES }).notNull().default("not_applied"),
  stageUpdatedAt: ts("stage_updated_at"),
  appliedAt: ts("applied_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

// Hacker News "Who is hiring?" threads and their job posts. Public data, shared by all
// users, filled by the sync every 3 hours (application/hnSync.ts). Ids are HN's own item ids.
export const hnThreads = pgTable("hn_threads", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  postedAt: ts("posted_at").notNull(),
  checkedAt: ts("checked_at"),
});

export const hnPosts = pgTable(
  "hn_posts",
  {
    id: integer("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => hnThreads.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    postedAt: ts("posted_at").notNull(),
    text: text("text").notNull(),
    // What Gemini Flash-Lite extracted; null until parsed.
    job: jsonb("job").$type<HnJob>(),
    parsedAt: ts("parsed_at"),
  },
  (t) => [index("hn_posts_thread_posted_idx").on(t.threadId, t.postedAt)],
);

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { FitAnalysis } from "@/domain/fit";
import type { JobPosting } from "@/domain/job";
import type { Profile } from "@/domain/profile";
import type { Answers, Question } from "@/domain/questions";
import type { TailoredResume } from "@/domain/resume";

// JSON columns hold whole domain documents. On Postgres these become jsonb.
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data", { mode: "json" }).$type<Profile>().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id")
    .notNull()
    .references(() => profiles.id),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jdText: text("jd_text").notNull(),
  job: text("job", { mode: "json" }).$type<JobPosting>().notNull(),
  fit: text("fit", { mode: "json" }).$type<FitAnalysis>().notNull(),
  questions: text("questions", { mode: "json" }).$type<Question[]>().notNull(),
  answers: text("answers", { mode: "json" }).$type<Answers>(),
  resume: text("resume", { mode: "json" }).$type<TailoredResume>(),
  pdfPath: text("pdf_path"),
  status: text("status", { enum: ["questions", "generated"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

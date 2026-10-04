import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { FitAnalysis } from "@/domain/fit";
import type { JobPosting } from "@/domain/job";
import type { Profile } from "@/domain/profile";
import type { Answers, Question } from "@/domain/questions";
import type { TailoredResume } from "@/domain/resume";

const timestamp = (name: string) => integer(name, { mode: "timestamp" });

// Better Auth core tables. Field names match what its Drizzle adapter expects.
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// App tables. JSON columns hold whole domain documents; on Postgres these become jsonb.
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  data: text("data", { mode: "json" }).$type<Profile>().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jdText: text("jd_text").notNull(),
  job: text("job", { mode: "json" }).$type<JobPosting>().notNull(),
  fit: text("fit", { mode: "json" }).$type<FitAnalysis>().notNull(),
  questions: text("questions", { mode: "json" }).$type<Question[]>().notNull(),
  answers: text("answers", { mode: "json" }).$type<Answers>(),
  resume: text("resume", { mode: "json" }).$type<TailoredResume>(),
  typSource: text("typ_source"),
  pdf: blob("pdf", { mode: "buffer" }),
  status: text("status", { enum: ["questions", "generated"] }).notNull(),
  createdAt: timestamp("created_at").notNull(),
});

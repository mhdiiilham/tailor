import { and, desc, eq, ilike, inArray, isNotNull, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type {
  Application,
  ApplicationPage,
  ApplicationPageQuery,
  NewApplication,
  StageStats,
} from "@/domain/application";
import { normalizeFit } from "@/domain/fit";
import type { AccountRepository, ApplicationRepository, ProfileRepository, StoredProfile } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import { stagesFor, type Stage } from "@/domain/stage";
import type { Db } from "./client";
import { containsPattern } from "./like";
import { applications, profiles, user } from "./schema";

export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly db: Db) {}

  async findByUser(userId: string): Promise<StoredProfile | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.userId, userId));
    return row ? { profile: row.data, updatedAt: row.updatedAt } : null;
  }

  async saveForUser(userId: string, profile: Profile): Promise<StoredProfile> {
    const updatedAt = new Date();
    await this.db
      .insert(profiles)
      .values({ userId, data: profile, updatedAt })
      .onConflictDoUpdate({ target: profiles.userId, set: { data: profile, updatedAt } });
    return { profile, updatedAt };
  }
}

// The list's order: offers first, then interviews and assessments, then everything else, then rejected,
// with withdrawn last. Within each group, newest applied date, then latest stage change,
// then id. Missing dates (not applied yet, stage never changed) sort as "-infinity",
// so they come after the dated ones.
const STAGE_RANK: Record<Stage, number> = {
  offer: 4,
  interviewing: 3,
  technical_assessment: 3,
  applied: 2,
  not_applied: 2,
  rejected: 1,
  withdrawn: 0,
};
// Built from the constant map above (no user input), so it's safe as raw SQL.
const rankCases = Object.entries(STAGE_RANK)
  .map(([stage, rank]) => `when '${stage}' then ${rank}`)
  .join(" ");
const rankSortKey = sql`case ${applications.stage} ${sql.raw(rankCases)} end`;
const appliedSortKey = sql`coalesce(${applications.appliedAt}, '-infinity'::timestamptz)`;
const stageSortKey = sql`coalesce(${applications.stageUpdatedAt}, '-infinity'::timestamptz)`;

// The cursor carries the last row's sort keys, base64url-encoded so callers treat it as opaque.
const CursorSchema = z.object({
  r: z.number().int().min(0).max(4),
  a: z.string().datetime().nullable(),
  s: z.string().datetime().nullable(),
  i: z.number().int().positive(),
});
type Cursor = z.infer<typeof CursorSchema>;

type SortKeys = { stage: Stage; appliedAt: Date | null; stageUpdatedAt: Date | null; id: number };

function encodeCursor(row: SortKeys): string {
  const value: Cursor = {
    r: STAGE_RANK[row.stage],
    a: row.appliedAt?.toISOString() ?? null,
    s: row.stageUpdatedAt?.toISOString() ?? null,
    i: row.id,
  };
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeCursor(cursor: string): Cursor {
  try {
    return CursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
  } catch {
    throw new Error("Invalid page. Reload the list and try again.");
  }
}

// Case-insensitive match on role, company, location or any stack item. LIKE's own
// wildcards are escaped, so "%" or "_" in a search only match themselves.
function matchesSearch(query: string): SQL {
  const pattern = containsPattern(query);
  return or(
    ilike(applications.role, pattern),
    ilike(applications.company, pattern),
    sql`${applications.job}->>'location' ilike ${pattern}`,
    sql`(${applications.job}->'techStack')::text ilike ${pattern}`,
  )!;
}

// Rows written before a schema change can hold older JSON shapes; upgrade on read.
const toApplication = (row: Application): Application => ({ ...row, fit: row.fit ? normalizeFit(row.fit) : null });

export class DrizzleApplicationRepository implements ApplicationRepository {
  constructor(private readonly db: Db) {}

  async create(app: NewApplication): Promise<Application> {
    const [row] = await this.db.insert(applications).values(app).returning();
    return toApplication(row);
  }

  async findById(userId: string, id: number): Promise<Application | null> {
    const [row] = await this.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)));
    return row ? toApplication(row) : null;
  }

  // Keyset pagination on the sort keys above: stable while rows are added or deleted,
  // with no skips or repeats on ties. Selects only the table's columns.
  async listPage(userId: string, { stage, search, cursor, limit }: ApplicationPageQuery): Promise<ApplicationPage> {
    const where: SQL[] = [eq(applications.userId, userId)];
    const stages = stagesFor(stage);
    if (stages) where.push(inArray(applications.stage, stages));
    if (cursor) {
      const after = decodeCursor(cursor);
      where.push(
        sql`(${rankSortKey}, ${appliedSortKey}, ${stageSortKey}, ${applications.id}) < (${after.r}::int, coalesce(${after.a}::timestamptz, '-infinity'), coalesce(${after.s}::timestamptz, '-infinity'), ${after.i}::int)`,
      );
    }
    const query = search.trim();
    if (query) where.push(matchesSearch(query));

    const rows = await this.db
      .select({
        id: applications.id,
        role: applications.role,
        company: applications.company,
        location: sql<string>`coalesce(${applications.job}->>'location', '')`,
        techStack: sql<string[]>`coalesce(${applications.job}->'techStack', '[]'::jsonb)`,
        // Null for a tracked job that hasn't been analyzed.
        score: sql<number | null>`round((${applications.fit}->>'score')::numeric)::int`,
        status: applications.status,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        createdAt: applications.createdAt,
        stageUpdatedAt: applications.stageUpdatedAt,
      })
      .from(applications)
      .where(and(...where))
      .orderBy(desc(rankSortKey), desc(appliedSortKey), desc(stageSortKey), desc(applications.id))
      .limit(limit + 1);

    // stageUpdatedAt is only selected for the cursor; the rows carry just the table's fields.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const items = rows.slice(0, limit).map(({ stageUpdatedAt, ...item }) => item);
    const last = rows[limit - 1];
    return { items, nextCursor: rows.length > limit ? encodeCursor(last) : null };
  }

  async stageStats(userId: string): Promise<StageStats[]> {
    return this.db
      .select({
        stage: applications.stage,
        count: sql<number>`count(*)::int`,
        applied: sql<number>`count(${applications.appliedAt})::int`,
        scored: sql<number>`count(${applications.fit})::int`,
        scoreSum: sql<number>`coalesce(sum(round((${applications.fit}->>'score')::numeric)), 0)::int`,
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.stage);
  }

  async update(userId: string, id: number, patch: Partial<Omit<NewApplication, "userId">>): Promise<Application> {
    const [row] = await this.db
      .update(applications)
      .set(patch)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    if (!row) throw new Error(`application ${id} not found`);
    return toApplication(row);
  }

  async delete(userId: string, id: number): Promise<boolean> {
    const rows = await this.db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id });
    return rows.length > 0;
  }

  async purgePdfsCreatedBefore(cutoff: Date): Promise<number> {
    const rows = await this.db
      .update(applications)
      .set({ pdf: null, pdfCreatedAt: null })
      .where(and(isNotNull(applications.pdf), lt(applications.pdfCreatedAt, cutoff)))
      .returning({ id: applications.id });
    return rows.length;
  }
}

export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: Db) {}

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(user).where(eq(user.id, userId));
  }
}

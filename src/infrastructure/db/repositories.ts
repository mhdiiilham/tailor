import { and, desc, eq, ilike, inArray, isNotNull, lt, or, sql, type SQL } from "drizzle-orm";
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
import { stagesFor } from "@/domain/stage";
import type { Db } from "./client";
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

// Case-insensitive match on role, company, location or any stack item. LIKE's own
// wildcards are escaped, so "%" or "_" in a search only match themselves.
function matchesSearch(query: string): SQL {
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return or(
    ilike(applications.role, pattern),
    ilike(applications.company, pattern),
    sql`${applications.job}->>'location' ilike ${pattern}`,
    sql`(${applications.job}->'techStack')::text ilike ${pattern}`,
  )!;
}

// Rows written before a schema change can hold older JSON shapes; upgrade on read.
const toApplication = (row: Application): Application => ({ ...row, fit: normalizeFit(row.fit) });

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

  // Cursor pagination on the id (newest first): stable while rows are added or
  // deleted, and served by the primary key index. Selects only the table's columns.
  async listPage(userId: string, { stage, search, cursor, limit }: ApplicationPageQuery): Promise<ApplicationPage> {
    const where: SQL[] = [eq(applications.userId, userId)];
    const stages = stagesFor(stage);
    if (stages) where.push(inArray(applications.stage, stages));
    if (cursor) where.push(lt(applications.id, cursor));
    const query = search.trim();
    if (query) where.push(matchesSearch(query));

    const rows = await this.db
      .select({
        id: applications.id,
        role: applications.role,
        company: applications.company,
        location: sql<string>`coalesce(${applications.job}->>'location', '')`,
        techStack: sql<string[]>`coalesce(${applications.job}->'techStack', '[]'::jsonb)`,
        score: sql<number>`coalesce(round((${applications.fit}->>'score')::numeric), 0)::int`,
        status: applications.status,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .where(and(...where))
      .orderBy(desc(applications.id))
      .limit(limit + 1);

    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? items[items.length - 1].id : null };
  }

  async stageStats(userId: string): Promise<StageStats[]> {
    return this.db
      .select({
        stage: applications.stage,
        count: sql<number>`count(*)::int`,
        applied: sql<number>`count(${applications.appliedAt})::int`,
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

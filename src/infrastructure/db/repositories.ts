import { and, desc, eq, isNotNull, lt } from "drizzle-orm";
import type { Application, NewApplication } from "@/domain/application";
import { normalizeFit } from "@/domain/fit";
import type { AccountRepository, ApplicationRepository, ProfileRepository, StoredProfile } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
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

  async list(userId: string): Promise<Application[]> {
    const rows = await this.db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.id));
    return rows.map(toApplication);
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

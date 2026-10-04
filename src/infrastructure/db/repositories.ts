import { and, desc, eq } from "drizzle-orm";
import type { Application, NewApplication } from "@/domain/application";
import type { ApplicationRepository, ProfileRepository, StoredProfile } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import type { Db } from "./client";
import { applications, profiles } from "./schema";

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

export class DrizzleApplicationRepository implements ApplicationRepository {
  constructor(private readonly db: Db) {}

  async create(app: NewApplication): Promise<Application> {
    const [row] = await this.db.insert(applications).values(app).returning();
    return row;
  }

  async findById(userId: string, id: number): Promise<Application | null> {
    const [row] = await this.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)));
    return row ?? null;
  }

  async list(userId: string): Promise<Application[]> {
    return this.db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.id));
  }

  async update(userId: string, id: number, patch: Partial<Omit<NewApplication, "userId">>): Promise<Application> {
    const [row] = await this.db
      .update(applications)
      .set(patch)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    if (!row) throw new Error(`application ${id} not found`);
    return row;
  }
}

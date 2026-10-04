import { asc, desc, eq } from "drizzle-orm";
import type { Application, NewApplication } from "@/domain/application";
import type { ApplicationRepository, ProfileRepository, StoredProfile } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import type { Db } from "./client";
import { applications, profiles } from "./schema";

// Single-user for now: the "default" profile is the first row.
export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly db: Db) {}

  async findDefault(): Promise<StoredProfile | null> {
    const row = this.db.select().from(profiles).orderBy(asc(profiles.id)).limit(1).get();
    return row ? { id: row.id, profile: row.data, updatedAt: row.updatedAt } : null;
  }

  async saveDefault(profile: Profile): Promise<StoredProfile> {
    const existing = await this.findDefault();
    const updatedAt = new Date();
    if (existing) {
      this.db.update(profiles).set({ data: profile, updatedAt }).where(eq(profiles.id, existing.id)).run();
      return { id: existing.id, profile, updatedAt };
    }
    const row = this.db.insert(profiles).values({ data: profile, updatedAt }).returning().get();
    return { id: row.id, profile: row.data, updatedAt: row.updatedAt };
  }
}

export class DrizzleApplicationRepository implements ApplicationRepository {
  constructor(private readonly db: Db) {}

  async create(app: NewApplication): Promise<Application> {
    return this.db
      .insert(applications)
      .values({ ...app, createdAt: new Date() })
      .returning()
      .get();
  }

  async findById(id: number): Promise<Application | null> {
    return this.db.select().from(applications).where(eq(applications.id, id)).get() ?? null;
  }

  async list(): Promise<Application[]> {
    return this.db.select().from(applications).orderBy(desc(applications.id)).all();
  }

  async update(id: number, patch: Partial<NewApplication>): Promise<Application> {
    const row = this.db.update(applications).set(patch).where(eq(applications.id, id)).returning().get();
    if (!row) throw new Error(`application ${id} not found`);
    return row;
  }
}

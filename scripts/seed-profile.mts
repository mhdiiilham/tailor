import { readFileSync } from "node:fs";
import path from "node:path";
import { openDb } from "../src/infrastructure/db/client";
import { DrizzleProfileRepository } from "../src/infrastructure/db/repositories";
import { parseProfileYaml } from "../src/infrastructure/profileYaml";

const file = path.resolve(process.argv[2] ?? "../profile/profile.yaml");
const db = openDb(process.env.DATABASE_URL ?? "./data/career.db");
const saved = await new DrizzleProfileRepository(db).saveDefault(parseProfileYaml(readFileSync(file, "utf8")));
console.log(`Imported ${file} as profile ${saved.id} (${saved.profile.experience.length} roles).`);

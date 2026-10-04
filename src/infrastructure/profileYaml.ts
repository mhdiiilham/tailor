import { parse } from "yaml";
import { ProfileSchema, type Profile } from "@/domain/profile";

export function parseProfileYaml(text: string): Profile {
  return ProfileSchema.parse(parse(text));
}

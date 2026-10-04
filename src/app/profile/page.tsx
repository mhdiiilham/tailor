import { stringify } from "yaml";
import { paths, profileRepository } from "@/container";
import { ImportProfileButton, ProfileEditor } from "./editor";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function ProfilePage() {
  const stored = await profileRepository().findDefault();

  return (
    <div className="grid gap-10">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="max-w-[62ch] text-muted">
          Every resume is built only from this. Nothing outside it gets added, so the more specific your highlights, the
          better the result.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-1">
          <h2 className="font-medium">
            {stored ? `${stored.profile.personal.name}` : "No profile yet"}
          </h2>
          <p className="text-sm text-muted">
            {stored
              ? `${stored.profile.experience.length} roles, ${stored.profile.projects.length} projects. Updated ${dateFormat.format(stored.updatedAt)}.`
              : "Import your existing profile.yaml to get started."}
          </p>
          <p className="font-mono text-xs text-faint">{paths.profileYaml}</p>
        </div>
        <ImportProfileButton replacing={Boolean(stored)} />
      </section>

      {stored ? <ProfileEditor initialYaml={stringify(stored.profile, { lineWidth: 0 })} /> : null}
    </div>
  );
}

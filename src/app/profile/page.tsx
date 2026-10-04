import { stringify } from "yaml";
import { profileRepository } from "@/container";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { ProfileEditor } from "./editor";
import { GuidePanel } from "./guidePanel";
import { PROFILE_TEMPLATE } from "./profileGuide";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function ProfilePage() {
  const user = await requireUser();
  const stored = await profileRepository().findByUser(user.id);

  return (
    <div className="grid gap-10">
      <PageHeader
        title="Profile"
        description={
          <div className="grid gap-2">
            <p>
              Every resume is built only from this. Nothing outside it gets added, so the more specific your highlights,
              the better the result.
            </p>
            <p className="text-sm text-faint">
              {stored
                ? `${stored.profile.experience.length} roles, ${stored.profile.projects.length} projects. Updated ${dateFormat.format(stored.updatedAt)}.`
                : "No profile yet. Fill in the template, or upload your profile.yaml. The guide explains each part."}
            </p>
          </div>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <ProfileEditor initialYaml={stored ? stringify(stored.profile, { lineWidth: 0 }) : PROFILE_TEMPLATE} />
        <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <GuidePanel />
        </div>
      </div>
    </div>
  );
}

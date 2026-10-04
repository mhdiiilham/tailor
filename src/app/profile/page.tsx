import { stringify } from "yaml";
import { profileRepository } from "@/container";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { ProfileEditor } from "./editor";
import { PROFILE_TEMPLATE } from "./profileTemplate";

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
                : "No profile yet. Upload your profile.yaml or fill in the template below."}
            </p>
          </div>
        }
      />
      <ProfileEditor initialYaml={stored ? stringify(stored.profile, { lineWidth: 0 }) : PROFILE_TEMPLATE} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { profileRepository } from "@/container";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { NewApplicationForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const user = await requireUser();
  if (!(await profileRepository().findByUser(user.id))) redirect("/profile");

  return (
    <div className="grid max-w-3xl gap-8">
      <PageHeader
        title="New application"
        description="Paste the full job description. You’ll see how well you fit and answer a few questions before anything is written."
      />
      <NewApplicationForm />
    </div>
  );
}

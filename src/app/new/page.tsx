import { redirect } from "next/navigation";
import { profileRepository } from "@/container";
import { NewApplicationForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  if (!(await profileRepository().findDefault())) redirect("/profile");

  return (
    <div className="grid max-w-3xl gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">New application</h1>
        <p className="max-w-[60ch] text-muted">
          Paste the full job description. You’ll see how well you fit and answer a few questions before anything is written.
        </p>
      </div>
      <NewApplicationForm />
    </div>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { TrackForm } from "./form";

export const metadata: Metadata = { title: "Track a job" };

export default async function TrackPage() {
  await requireUser();
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <PageHeader
        title="Track a job"
        description="Add a job you applied to without tailoring a resume here, so every application is in one list. You can paste its job description later to analyze it and tailor a resume."
      />
      <TrackForm />
    </div>
  );
}

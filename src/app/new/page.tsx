import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IdentificationCard } from "@phosphor-icons/react/dist/ssr";
import { hnRepository, profileRepository } from "@/container";
import { profileTerms } from "@/domain/techTerms";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { NewApplicationWorkspace } from "./workspace";

export const metadata: Metadata = { title: "New application" };

export const dynamic = "force-dynamic";

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function NewApplicationPage({ searchParams }: PageProps<"/new">) {
  const user = await requireUser();
  const stored = await profileRepository().findByUser(user.id);
  if (!stored) redirect("/profile");
  const { profile } = stored;
  const terms = profileTerms(profile);
  // "Tailor CV" on the HN Who's Hiring page opens this with the post's text pasted in.
  const hnId = Number((await searchParams).hn);
  const hnPost = Number.isInteger(hnId) && hnId > 0 ? await hnRepository().findPost(hnId) : null;

  const profileCard = (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Profile used</p>
        <Link href="/profile" className="text-xs font-medium text-accent">
          Change
        </Link>
      </div>
      <p className="flex items-center gap-2 text-lg font-medium">
        <IdentificationCard size={20} className="text-accent" />
        {profile.personal.name}
      </p>
      <p className="font-mono text-xs text-faint">
        {count(profile.experience.length, "role")} · {count(profile.projects.length, "project")} ·{" "}
        {count(terms.length, "skill")}
      </p>
    </Card>
  );

  return (
    <div className="grid gap-8">
      <PageHeader
        title="New application"
        description={
          hnPost
            ? `Pasted from Hacker News${hnPost.job?.company ? `: ${hnPost.job.company}` : ""}. Check it, then analyze your fit and answer a few questions before anything is written.`
            : "Paste the full job description. You’ll see how well you fit and answer a few questions before anything is written."
        }
      />
      <NewApplicationWorkspace
        profile={profile}
        terms={terms}
        profileCard={profileCard}
        initialText={hnPost?.text ?? ""}
      />
    </div>
  );
}

"use client";

import { BookmarkSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { trackApplication } from "@/app/actions";
import { Button, Card, Field, FormMessage, TextArea, TextInput } from "@/components/ui";
import { STAGE_LABELS, STAGES, type Stage } from "@/domain/stage";

export function TrackForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("applied");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(form: FormData) {
    const value = (name: string) => String(form.get(name) ?? "");
    setError(undefined);
    startTransition(async () => {
      const result = await trackApplication({
        company: value("company"),
        role: value("role"),
        jobUrl: value("jobUrl"),
        location: value("location"),
        stage,
        appliedOn: stage === "not_applied" ? "" : value("appliedOn"),
        notes: value("notes"),
      });
      if (result.error || !result.id) return setError(result.error ?? "Something went wrong.");
      router.push(`/applications/${result.id}`);
    });
  }

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(new FormData(e.currentTarget));
        }}
        className="grid gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company" htmlFor="company">
            <TextInput id="company" name="company" required maxLength={200} placeholder="UangAI" />
          </Field>
          <Field label="Role" htmlFor="role">
            <TextInput id="role" name="role" required maxLength={200} placeholder="Senior Fullstack Engineer" />
          </Field>
        </div>
        <Field
          label="Job link"
          htmlFor="jobUrl"
          hint="Optional. The posting on LinkedIn or the company's careers page."
        >
          <TextInput id="jobUrl" name="jobUrl" type="url" placeholder="https://www.linkedin.com/jobs/view/..." />
        </Field>
        <Field label="Location" htmlFor="location" hint="Optional.">
          <TextInput id="location" name="location" maxLength={200} placeholder="Remote, Singapore" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Stage" htmlFor="stage">
            <select
              id="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="h-10 w-full rounded-ui border border-line bg-sunken px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          {stage !== "not_applied" ? (
            <Field label="Applied on" htmlFor="appliedOn" hint="Leave empty for today.">
              <TextInput id="appliedOn" name="appliedOn" type="date" />
            </Field>
          ) : null}
        </div>
        <Field label="Notes" htmlFor="notes" hint="Optional. Recruiter, salary range, referral, when to follow up.">
          <TextArea id="notes" name="notes" rows={4} maxLength={5000} />
        </Field>
        <FormMessage error={error} />
        <div>
          <Button type="submit" disabled={pending}>
            <BookmarkSimple size={16} />
            {pending ? "Adding..." : "Track this job"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

"use client";

import { FloppyDisk, NotePencil } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { saveApplicationDetails, type ActionState } from "@/app/actions";
import { Button, Card, Field, FormMessage, SectionHeader, TextArea, TextInput } from "@/components/ui";

// The posting's link and the person's own notes (recruiter, salary, follow-ups).
export function DetailsCard({ id, jobUrl, notes }: { id: number; jobUrl: string | null; notes: string | null }) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <SectionHeader
        icon={<NotePencil size={18} />}
        title="Link and notes"
        description="Only you see these: the posting, who you talked to, salary, when to follow up."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(async () =>
            setState(
              await saveApplicationDetails(id, {
                jobUrl: String(form.get("jobUrl") ?? ""),
                notes: String(form.get("notes") ?? ""),
              }),
            ),
          );
        }}
        className="grid gap-4"
      >
        <Field label="Job link" htmlFor={`job-url-${id}`}>
          <TextInput
            id={`job-url-${id}`}
            name="jobUrl"
            type="url"
            defaultValue={jobUrl ?? ""}
            placeholder="https://www.linkedin.com/jobs/view/..."
          />
        </Field>
        <Field label="Notes" htmlFor={`notes-${id}`}>
          <TextArea id={`notes-${id}`} name="notes" rows={4} defaultValue={notes ?? ""} />
        </Field>
        <FormMessage {...state} />
        <div>
          <Button type="submit" variant="secondary" disabled={pending}>
            <FloppyDisk size={16} />
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

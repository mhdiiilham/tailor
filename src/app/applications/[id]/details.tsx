"use client";

import { FloppyDisk, NotePencil } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { saveApplicationNotes, type ActionState } from "@/app/actions";
import { Button, Card, FormMessage, SectionHeader, TextArea } from "@/components/ui";

// The person's own notes on an application: recruiter, salary, when to follow up.
export function NotesCard({ id, notes }: { id: number; notes: string | null }) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <SectionHeader
        icon={<NotePencil size={18} />}
        title="Notes"
        description="Only you see these: who you talked to, salary, when to follow up."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = String(new FormData(e.currentTarget).get("notes") ?? "");
          startTransition(async () => setState(await saveApplicationNotes(id, text)));
        }}
        className="grid gap-3"
      >
        <TextArea name="notes" rows={4} maxLength={5000} defaultValue={notes ?? ""} aria-label="Notes" />
        <FormMessage {...state} />
        <div>
          <Button type="submit" variant="secondary" disabled={pending}>
            <FloppyDisk size={16} />
            {pending ? "Saving..." : "Save notes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

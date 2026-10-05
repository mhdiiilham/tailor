"use client";

import { BookmarkSimple, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { trackApplication } from "@/app/actions";
import { Button, Field, FormMessage, Select, TextArea, TextInput } from "@/components/ui";
import { STAGE_LABELS, STAGES, type Stage } from "@/domain/stage";

// "Track a job" opens a dialog to add a job applied to without tailoring a resume here.
// It uses the native <dialog>: focus stays inside, Esc closes it, the page behind is inert.
export function TrackJobButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  // A new key per opening gives a fresh, empty form each time.
  const [opening, setOpening] = useState(0);

  function open() {
    setOpening((n) => n + 1);
    dialog.current?.showModal();
  }

  return (
    <>
      <Button variant="secondary" onClick={open}>
        <BookmarkSimple size={16} />
        Track a job
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="track-job-title"
        // A click on the backdrop (the dialog itself, outside the panel) closes it.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto w-[min(640px,calc(100%-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card border border-line bg-raised p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="grid gap-5 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 id="track-job-title" className="text-lg font-medium">
                Track a job
              </h2>
              <p className="text-sm text-muted">
                For a job you applied to without tailoring a resume here. You can paste its job description later to
                analyze it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-ui text-faint hover:bg-sunken hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          <TrackForm key={opening} onDone={() => dialog.current?.close()} />
        </div>
      </dialog>
    </>
  );
}

function TrackForm({ onDone }: { onDone: () => void }) {
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
        location: value("location"),
        stage,
        appliedOn: stage === "not_applied" ? "" : value("appliedOn"),
        jdText: value("jdText"),
      });
      if (result.error) return setError(result.error);
      onDone();
      router.refresh(); // the new job shows at the top of the list
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="grid gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="track-company">
          <TextInput id="track-company" name="company" required maxLength={200} placeholder="UangAI" />
        </Field>
        <Field label="Role" htmlFor="track-role">
          <TextInput id="track-role" name="role" required maxLength={200} placeholder="Senior Fullstack Engineer" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Location" htmlFor="track-location">
          <TextInput id="track-location" name="location" maxLength={200} placeholder="Remote" />
        </Field>
        <Field label="Stage" htmlFor="track-stage">
          <Select id="track-stage" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        {stage !== "not_applied" ? (
          <Field label="Applied on" htmlFor="track-applied">
            <TextInput id="track-applied" name="appliedOn" type="date" title="Leave empty for today" />
          </Field>
        ) : null}
      </div>
      <Field
        label="Job description"
        htmlFor="track-jd"
        hint="Optional. Saved with the job, so you can analyze it and tailor a resume later without finding it again."
      >
        <TextArea id="track-jd" name="jdText" rows={5} mono placeholder="Paste the job description here" />
      </Field>
      <FormMessage error={error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-faint">Applied on defaults to today.</p>
        <Button type="submit" disabled={pending}>
          <BookmarkSimple size={16} />
          {pending ? "Adding..." : "Track this job"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteApplication } from "@/app/actions";
import { Button, FormMessage } from "@/components/ui";

export function DeleteApplication({ id }: { id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <Button
        variant="danger"
        disabled={pending}
        className="justify-self-start"
        onClick={() => {
          if (
            !confirm(
              "Delete this application? The job description, your answers, the resume and its PDF are removed for good.",
            )
          )
            return;
          startTransition(async () => {
            const result = await deleteApplication(id);
            if (result.error) setError(result.error);
            else router.push("/");
          });
        }}
      >
        {pending ? "Deleting..." : "Delete application"}
      </Button>
      <FormMessage error={error} />
    </div>
  );
}

"use client";

import { UserMinus, Warning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions";
import { setGeminiKey } from "@/components/geminiKey";
import { Button, Card, FormMessage } from "@/components/ui";

export function DeleteAccount() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Delete your account? Your profile and every application, resume and PDF are removed for good."))
      return;
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.error) return setError(result.error);
      setGeminiKey("");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className="border-danger/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-ui bg-danger-soft text-danger">
            <Warning size={18} />
          </span>
          <div className="grid gap-1">
            <h2 className="text-lg font-medium">Delete account</h2>
            <p className="max-w-[56ch] text-sm text-muted">
              Removes your sign-in, your profile and all your applications from the server. You can sign in again later
              and start fresh.
            </p>
          </div>
        </div>
        <Button variant="danger" disabled={pending} onClick={remove}>
          <UserMinus size={16} />
          {pending ? "Deleting..." : "Delete my account"}
        </Button>
      </div>
      <FormMessage error={error} />
    </Card>
  );
}

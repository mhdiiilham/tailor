"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions";
import { setGeminiKey } from "@/components/geminiKey";
import { Button, FormMessage, SectionHeader } from "@/components/ui";

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
    <section className="grid gap-4 border-t border-line pt-8">
      <SectionHeader
        title="Delete account"
        description="Removes your sign-in, your profile and all your applications from the server. You can sign in again later and start fresh."
      />
      <Button variant="danger" disabled={pending} onClick={remove} className="justify-self-start">
        {pending ? "Deleting..." : "Delete my account"}
      </Button>
      <FormMessage error={error} />
    </section>
  );
}

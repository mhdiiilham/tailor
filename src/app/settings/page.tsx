import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { DeleteAccount } from "./deleteAccount";
import { GeminiKeySettings } from "./geminiKeySettings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader title="Settings" description={`Signed in as ${user.email}.`} />
      <GeminiKeySettings />
      <DeleteAccount />
    </div>
  );
}

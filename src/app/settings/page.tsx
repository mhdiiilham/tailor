import { PageHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { GeminiKeySettings } from "./geminiKeySettings";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="grid max-w-2xl gap-10">
      <PageHeader title="Settings" description={`Signed in as ${user.email}.`} />
      <GeminiKeySettings />
    </div>
  );
}

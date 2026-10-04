import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { GoogleButton } from "./googleButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="grid max-w-md gap-8 pt-6 md:pt-16">
      <PageHeader
        title="Sign in to Tailor"
        description="Paste a job description, answer a few questions, get a resume built only from your own profile."
      />
      <GoogleButton />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          That Google account isn’t on the invite list. Ask the owner to add your email.
        </p>
      ) : (
        <p className="text-sm text-faint">Invite only. Your email has to be on the list.</p>
      )}
    </div>
  );
}

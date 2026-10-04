"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { authClient } from "@/infrastructure/auth/authClient";
import { setGeminiKey } from "./geminiKey";
import { Button } from "./ui";

export function UserMenu({ name, image }: { name: string; image: string | null }) {
  const router = useRouter();

  async function signOut() {
    setGeminiKey("");
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 border-l border-line pl-2 md:pl-3">
      {image ? (
        // Google avatars are small and already sized; next/image would need a remote pattern.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" width={28} height={28} referrerPolicy="no-referrer" className="size-7 rounded-full" />
      ) : null}
      <span className="sr-only">Signed in as {name}</span>
      <Button variant="ghost" onClick={signOut} title="Sign out (also forgets the Gemini key in this browser)">
        <SignOut size={18} />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}

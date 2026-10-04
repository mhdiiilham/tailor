"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { authClient } from "@/infrastructure/auth/authClient";

export function GoogleButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      disabled={pending}
      className="w-full sm:w-auto sm:justify-self-start"
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/login" });
      }}
    >
      <GoogleLogo size={18} weight="bold" />
      {pending ? "Opening Google..." : "Continue with Google"}
    </Button>
  );
}

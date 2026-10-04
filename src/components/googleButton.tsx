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
      className="justify-self-start"
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/?error=access" });
      }}
    >
      <GoogleLogo size={18} weight="bold" />
      {pending ? "Opening Google..." : "Continue with Google"}
    </Button>
  );
}

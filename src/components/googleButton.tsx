"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { authClient } from "@/infrastructure/auth/authClient";

// Sign-in is only possible after confirming age and accepting the terms.
export function GoogleButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <div className={`grid gap-4 ${fullWidth ? "" : "justify-items-start"}`}>
      <label className="flex max-w-[52ch] cursor-pointer items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
        />
        <span>
          I’m 18 or older and I agree to the{" "}
          <Link href="/terms" className="text-accent underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <Button
        className={fullWidth ? "w-full" : undefined}
        disabled={!agreed || pending}
        onClick={async () => {
          setPending(true);
          await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/?error=access" });
        }}
      >
        <GoogleLogo size={18} weight="bold" />
        {pending ? "Opening Google..." : "Continue with Google"}
      </Button>
    </div>
  );
}

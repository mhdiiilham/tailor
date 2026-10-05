"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
      {/* Google's own button artwork (Dark, pill), unmodified, per its branding guidelines. */}
      <button
        type="button"
        aria-label="Sign in with Google"
        aria-busy={pending}
        disabled={!agreed || pending}
        onClick={async () => {
          setPending(true);
          await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/?error=access" });
        }}
        className={`rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${fullWidth ? "justify-self-center" : ""}`}
      >
        <Image src="/google-signin-dark.svg" alt="" width={198} height={44} priority />
      </button>
      {pending ? <p className={`text-xs text-faint ${fullWidth ? "text-center" : ""}`}>Opening Google...</p> : null}
    </div>
  );
}

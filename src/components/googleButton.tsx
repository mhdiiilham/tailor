"use client";

import { Roboto } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/infrastructure/auth/authClient";

// Google's sign-in button spec asks for Roboto Medium.
const roboto = Roboto({ weight: "500", subsets: ["latin"] });

// Sign-in is only possible after confirming age and accepting the terms.
// `next` is where to land after signing in, already checked with safeNext.
export function GoogleButton({ fullWidth = false, next = "/" }: { fullWidth?: boolean; next?: string }) {
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
      {/* Built to Google's "Dark" button spec: official G logo, #131314 fill, #8E918F border,
          #E3E3E3 Roboto Medium text, and Google's 8% / 12% state layers on hover and press. */}
      <button
        type="button"
        aria-busy={pending}
        disabled={!agreed || pending}
        onClick={async () => {
          setPending(true);
          await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/?error=access" });
        }}
        className={`${roboto.className} inline-flex h-11 items-center justify-center gap-2.5 rounded-full border border-[#8E918F] bg-[#131314] px-4 text-sm text-[#E3E3E3] transition-colors hover:bg-[#242425] active:bg-[#2c2c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#131314] ${fullWidth ? "w-full" : ""}`}
      >
        <Image src="/google-g.svg" alt="" width={20} height={20} priority />
        {pending ? "Opening Google..." : "Sign in with Google"}
      </button>
    </div>
  );
}

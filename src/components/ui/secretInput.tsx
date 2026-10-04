"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState, type ComponentProps } from "react";
import { TextInput } from "./field";

// A password-style field with a show/hide button, for API keys.
export function SecretInput({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={shown ? "text" : "password"} mono className={`pr-11 ${className}`} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide key" : "Show key"}
        aria-pressed={shown}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-ui text-faint transition-colors hover:bg-raised hover:text-ink"
      >
        {shown ? <EyeSlash size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

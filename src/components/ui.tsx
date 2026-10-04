"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles } from "./styles";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { pendingLabel: string; variant?: keyof typeof buttonStyles }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles[variant]} {...props}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p role="alert" className="whitespace-pre-line text-sm text-danger">
        {error}
      </p>
    );
  }
  if (notice) return <p className="text-sm text-muted">{notice}</p>;
  return null;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-faint">{hint}</p> : null}
    </div>
  );
}

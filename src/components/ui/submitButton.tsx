"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

// A submit button that disables itself and swaps its label while the form's action runs.
// Forms that run their work in the browser pass `pending` themselves.
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

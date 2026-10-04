import type { ComponentProps } from "react";

// A raised panel. "dashed" marks a placeholder waiting to be filled.
export function Card({ dashed = false, className = "", ...props }: ComponentProps<"div"> & { dashed?: boolean }) {
  const surface = dashed ? "border-dashed bg-transparent" : "bg-raised";
  return (
    <div
      className={`grid gap-4 rounded-card border border-line p-5 md:p-6 ${surface} ${className}`.trim()}
      {...props}
    />
  );
}

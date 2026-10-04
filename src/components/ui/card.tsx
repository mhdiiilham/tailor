import type { ComponentProps } from "react";

// A bordered surface. "dashed" marks a placeholder waiting to be filled.
export function Card({ dashed = false, className = "", ...props }: ComponentProps<"div"> & { dashed?: boolean }) {
  const surface = dashed ? "border-dashed" : "bg-raised";
  return <div className={`grid gap-3 rounded-ui border border-line p-6 ${surface} ${className}`.trim()} {...props} />;
}

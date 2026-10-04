import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-ui border border-line bg-raised px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

// Label above, hint below, as one block.
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label?: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-sm text-faint">{hint}</p> : null}
    </div>
  );
}

export function TextArea({ mono = false, className = "", ...props }: ComponentProps<"textarea"> & { mono?: boolean }) {
  return <textarea className={`${control} ${mono ? "font-mono text-[13px]" : ""} ${className}`.trim()} {...props} />;
}

export function TextInput({ mono = false, className = "", ...props }: ComponentProps<"input"> & { mono?: boolean }) {
  return <input className={`${control} ${mono ? "font-mono" : ""} ${className}`.trim()} {...props} />;
}

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-ui border border-line bg-sunken px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

// Label above, hint below, as one block. content-start keeps the three together at the
// top, so fields side by side line up even when only one of them has a hint.
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
    <div className="grid content-start gap-2">
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

// A native select styled like the text inputs, with its own caret.
export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select className={`${control} cursor-pointer appearance-none pr-10 ${className}`.trim()} {...props}>
        {children}
      </select>
      <CaretDown
        size={14}
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </span>
  );
}

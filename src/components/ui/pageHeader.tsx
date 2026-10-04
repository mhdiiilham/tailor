import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{title}</h1>
        {description ? <div className="max-w-[62ch] text-muted">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}

// `icon` sits in a tinted tile beside the title; `aside` is a badge or action on the right.
export function SectionHeader({
  title,
  description,
  icon,
  aside,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
}) {
  const text = (
    <div className="grid gap-1">
      <h2 className="text-lg font-medium">{title}</h2>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
  if (!icon && !aside) return text;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-ui bg-accent-soft text-accent">{icon}</span>
        ) : null}
        {text}
      </div>
      {aside}
    </div>
  );
}

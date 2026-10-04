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

export function SectionHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="grid gap-1">
      <h2 className="text-lg font-medium">{title}</h2>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
}

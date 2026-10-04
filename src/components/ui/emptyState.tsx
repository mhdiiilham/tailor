import type { ReactNode } from "react";
import { Card } from "./card";

export function EmptyState({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <Card dashed className="max-w-xl">
      <h2 className="font-medium">{title}</h2>
      <div className="text-sm text-muted">{children}</div>
      {actions ? <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">{actions}</div> : null}
    </Card>
  );
}

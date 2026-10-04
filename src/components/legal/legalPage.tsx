import type { ReactNode } from "react";

export const LEGAL_UPDATED = "4 October 2026";
export const CONTACT_EMAIL = "hi@muhammadilham.xyz";

// Readable long-form layout for the Privacy Policy and Terms.
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <article className="mx-auto grid max-w-3xl gap-8">
      <header className="grid gap-3 border-b border-line pb-8">
        <p className="font-mono text-xs text-faint">Last updated {LEGAL_UPDATED}</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <div className="text-muted leading-relaxed [&_a]:text-accent [&_a]:underline">{intro}</div>
      </header>
      <div className="grid gap-8 text-[15px] leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

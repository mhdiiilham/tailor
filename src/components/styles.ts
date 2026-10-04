const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ui px-4 h-10 text-sm font-medium transition-[transform,background-color,color,opacity] active:translate-y-px disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const buttonStyles = {
  primary: `${base} bg-accent text-on-accent hover:opacity-90`,
  secondary: `${base} border border-line bg-raised text-ink hover:border-faint`,
};

export const inputStyles =
  "w-full rounded-ui border border-line bg-raised px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ui text-sm font-medium transition-[transform,background-color,color,opacity,border-color] active:translate-y-px disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<ButtonVariant, string> = {
  primary: "h-10 px-4 bg-accent text-on-accent hover:opacity-90",
  secondary: "h-10 px-4 border border-line bg-raised text-ink hover:border-faint",
  ghost: "p-1.5 text-muted hover:bg-raised hover:text-ink",
};

export function buttonClass(variant: ButtonVariant = "primary", className = ""): string {
  return `${base} ${variants[variant]} ${className}`.trim();
}

type Variant = { variant?: ButtonVariant };

export function Button({ variant, className, type = "button", ...props }: ComponentProps<"button"> & Variant) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant, className, ...props }: ComponentProps<typeof Link> & Variant) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

// For plain <a>: file downloads and external pages.
export function ButtonAnchor({ variant, className, ...props }: ComponentProps<"a"> & Variant) {
  return <a className={buttonClass(variant, className)} {...props} />;
}

import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ui font-medium transition-[transform,background-color,color,opacity,border-color] active:translate-y-px disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "border border-line bg-raised text-ink hover:border-faint hover:bg-sunken",
  ghost: "text-muted hover:bg-sunken hover:text-ink",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "", size: ButtonSize = "md"): string {
  const sizing = variant === "ghost" && size === "md" ? "p-1.5 text-sm" : sizes[size];
  return `${base} ${variants[variant]} ${sizing} ${className}`.trim();
}

type Options = { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & Options) {
  return <button type={type} className={buttonClass(variant, className, size)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & Options) {
  return <Link className={buttonClass(variant, className, size)} {...props} />;
}

// For plain <a>: file downloads and external pages.
export function ButtonAnchor({ variant, size, className, ...props }: ComponentProps<"a"> & Options) {
  return <a className={buttonClass(variant, className, size)} {...props} />;
}

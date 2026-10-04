"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; wide?: boolean };

// The top navigation, with the current page highlighted.
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/applications") : pathname.startsWith(href);

  return (
    <nav className="flex items-center overflow-x-auto text-sm">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${item.wide ? "hidden sm:block" : ""} whitespace-nowrap rounded-ui px-2 py-1.5 transition-colors md:px-3 ${
              active ? "bg-raised text-ink" : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

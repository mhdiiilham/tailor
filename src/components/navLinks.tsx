"use client";

import { Briefcase, Gear, IdentificationCard, ListChecks, PlusCircle, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

const ICONS: Record<string, Icon> = {
  "/": ListChecks,
  "/new": PlusCircle,
  "/hiring": Briefcase,
  "/profile": IdentificationCard,
  "/settings": Gear,
};

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/applications") : pathname.startsWith(href);
}

// The top navigation on wider screens, with the current page highlighted.
export function NavLinks({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav className="hidden items-center text-sm md:flex">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-ui px-3 py-1.5 transition-colors ${
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

// On phones the links move to a tab bar at the bottom, where all of them fit and
// stay within thumb reach. It leaves room for the iPhone home indicator.
export function MobileTabBar({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = isActive(item.href);
        const ItemIcon = ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-accent" : "text-muted"}`}
          >
            {ItemIcon ? <ItemIcon size={22} weight={active ? "fill" : "regular"} /> : null}
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

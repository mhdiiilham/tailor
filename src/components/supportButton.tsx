"use client";

import { Coffee, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useSyncExternalStore } from "react";

export const SUPPORT_URL = "https://www.buymeacoffee.com/mopiiggy";

const HIDDEN_KEY = "tailor.hideSupport";
const listeners = new Set<() => void>();

function isHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function hide() {
  try {
    localStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    // Private mode: it just comes back next visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A small cup in the corner that only shows the full button on hover or focus, so it
// never sits over the page's own buttons. It opens in a new tab (no lost work) and can
// be dismissed for good. Phones get the footer link instead.
export function SupportButton() {
  // Hidden on the server and until the browser says otherwise, so dismissing never flashes.
  const hidden = useSyncExternalStore(subscribe, isHidden, () => true);
  if (hidden) return null;

  return (
    <div className="group fixed bottom-5 right-5 z-20 hidden md:block print:hidden">
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee (opens in a new tab)"
        className="relative grid size-11 place-items-center rounded-full bg-[#BD5FFF] text-[#FFDD00] shadow-lg ring-1 ring-black/20 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Coffee size={22} weight="fill" />
        <Image
          src="/buy-me-a-coffee.svg"
          alt=""
          width={169}
          height={36}
          className="pointer-events-none absolute right-full mr-2 max-w-none opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </a>
      <button
        type="button"
        onClick={hide}
        aria-label="Hide the Buy me a coffee button"
        className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-line bg-raised text-faint opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

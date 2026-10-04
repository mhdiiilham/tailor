"use client";

import { useEffect } from "react";

// After generating or revising, the page re-renders with the new resume. The form
// sets this one-time flag before submitting; when the resume appears (this component
// is keyed by the resume's version, so it remounts on every change) it scrolls to it.
const FLAG = "tailor.scrollToResume";

export function requestScrollToResume(applicationId: number) {
  try {
    sessionStorage.setItem(FLAG, String(applicationId));
  } catch {
    // Storage blocked; the page just won't scroll.
  }
}

export function cancelScrollToResume() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {}
}

export function ScrollToResume({ applicationId, targetId }: { applicationId: number; targetId: string }) {
  useEffect(() => {
    let wanted = false;
    try {
      wanted = sessionStorage.getItem(FLAG) === String(applicationId);
      if (wanted) sessionStorage.removeItem(FLAG);
    } catch {}
    if (!wanted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    );
  }, [applicationId, targetId]);
  return null;
}

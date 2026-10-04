import { describe, expect, it } from "vitest";
import { isPdfExpired, PDF_RETENTION_MS } from "./retention";

const now = new Date("2026-10-04T12:00:00Z");

describe("isPdfExpired", () => {
  it("keeps a PDF younger than 24 hours", () => {
    expect(isPdfExpired(new Date(now.getTime() - PDF_RETENTION_MS + 60_000), now)).toBe(false);
  });

  it("expires a PDF at or after 24 hours", () => {
    expect(isPdfExpired(new Date(now.getTime() - PDF_RETENTION_MS), now)).toBe(true);
  });

  it("treats a missing timestamp as expired", () => {
    expect(isPdfExpired(null, now)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  findBannedWords,
  findResumeTells,
  findWeakOpeners,
  findWritingTells,
  stripEmDashes,
  toPlainText,
} from "./writing";

describe("findBannedWords", () => {
  it("finds banned words including inflections", () => {
    expect(findBannedWords("Leveraged a robust queue")).toEqual(["leverage", "robust"]);
  });

  it("ignores clean text", () => {
    expect(findBannedWords("Built a queue in Go")).toEqual([]);
  });
});

describe("stripEmDashes", () => {
  it("replaces spaced and tight em dashes", () => {
    expect(stripEmDashes("Go — fast")).toBe("Go, fast");
    expect(stripEmDashes("event—driven")).toBe("event-driven");
  });
});

describe("findWritingTells", () => {
  it("finds banned words, AI vocabulary and stock phrases", () => {
    const text = "I am writing to express my interest. I'd delve into a robust, pivotal role. Furthermore, thanks.";
    expect(findWritingTells(text)).toEqual(["robust", "delve", "pivotal", "i am writing to express", "furthermore"]);
  });

  it("handles curly apostrophes", () => {
    expect(findWritingTells("I’m excited to apply")).toEqual(["excited", "i'm excited"]);
  });

  it("passes plain, specific writing", () => {
    expect(findWritingTells("I cut reconciliation from 3 hours to 12 minutes at Kopi Ledger.")).toEqual([]);
  });
});

describe("toPlainText", () => {
  it("removes em dashes, curly quotes and bold markers", () => {
    expect(toPlainText("  The “ledger” work — **fast** and it’s done  ")).toBe(
      "The \"ledger\" work, fast and it's done",
    );
  });
});

describe("findResumeTells", () => {
  it("finds banned words and resume cliches", () => {
    const text = "Results-driven engineer with a proven track record who leveraged Go.";
    expect(findResumeTells(text)).toEqual(["leverage", "results-driven", "proven track record"]);
  });

  it("ignores clean text", () => {
    expect(findResumeTells("Cut API latency 90% by replacing sequential calls with goroutines")).toEqual([]);
  });
});

describe("findWeakOpeners", () => {
  it("flags bullets that open with a weak verb", () => {
    const bullets = [
      "Supported production tournament infrastructure",
      "Handled a critical incident",
      "Responsible for the billing service",
      "Helped with the migration",
      "Worked on search",
      "Built the rules catalog",
    ];
    expect(findWeakOpeners(bullets)).toEqual(["Supported", "Handled", "Responsible for", "Helped with", "Worked on"]);
  });

  it("lists each weak opener once", () => {
    expect(findWeakOpeners(["Supported a", "Supported b"])).toEqual(["Supported"]);
  });
});

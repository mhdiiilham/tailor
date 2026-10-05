import { describe, expect, it } from "vitest";
import { dayTotal, parseUsageLog, recentDays, recordUsage, usageDay } from "./usage";

const call = (model: string, inputTokens: number, outputTokens: number) => ({ model, inputTokens, outputTokens });

describe("usageDay", () => {
  it("uses Google's quota day, which resets at midnight Pacific time", () => {
    // 05:00 UTC on Oct 5 is still Oct 4 in California.
    expect(usageDay(new Date("2026-10-05T05:00:00Z"))).toBe("2026-10-04");
    expect(usageDay(new Date("2026-10-05T08:00:00Z"))).toBe("2026-10-05");
  });
});

describe("recordUsage", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  it("adds up requests and tokens per model for the day", () => {
    let log = recordUsage({}, call("gemini-flash-latest", 1000, 300), now);
    log = recordUsage(log, call("gemini-flash-latest", 500, 200), now);
    log = recordUsage(log, call("gemini-flash-lite-latest", 100, 50), now);

    expect(dayTotal(log, "2026-10-05")).toEqual({
      requests: 3,
      inputTokens: 1600,
      outputTokens: 550,
      byModel: {
        "gemini-flash-latest": { requests: 2, inputTokens: 1500, outputTokens: 500 },
        "gemini-flash-lite-latest": { requests: 1, inputTokens: 100, outputTokens: 50 },
      },
    });
  });

  it("keeps only the last 7 days", () => {
    const old = recordUsage({}, call("m", 1, 1), new Date("2026-09-20T12:00:00Z"));
    const log = recordUsage(old, call("m", 1, 1), now);
    expect(Object.keys(log)).toEqual(["2026-10-05"]);
  });

  it("does not change the log it was given", () => {
    const before = recordUsage({}, call("m", 1, 1), now);
    recordUsage(before, call("m", 5, 5), now);
    expect(dayTotal(before, "2026-10-05").requests).toBe(1);
  });
});

describe("recentDays", () => {
  it("lists the last 7 days, newest first, with zero for quiet days", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const log = recordUsage(recordUsage({}, call("m", 10, 5), now), call("m", 1, 1), new Date("2026-10-03T12:00:00Z"));
    const days = recentDays(log, now);
    expect(days.map((d) => d.day)).toEqual([
      "2026-10-05",
      "2026-10-04",
      "2026-10-03",
      "2026-10-02",
      "2026-10-01",
      "2026-09-30",
      "2026-09-29",
    ]);
    expect(days.map((d) => d.requests)).toEqual([1, 0, 1, 0, 0, 0, 0]);
  });
});

describe("parseUsageLog", () => {
  it("reads a saved log and ignores anything malformed", () => {
    const saved = JSON.stringify({ "2026-10-05": { m: { requests: 2, inputTokens: 3, outputTokens: 4 } } });
    expect(dayTotal(parseUsageLog(saved), "2026-10-05").requests).toBe(2);
    expect(parseUsageLog("not json")).toEqual({});
    expect(parseUsageLog(null)).toEqual({});
    expect(parseUsageLog('{"2026-10-05":{"m":{"requests":"x"}}}')).toEqual({});
  });
});

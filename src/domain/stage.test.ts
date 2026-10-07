import { describe, expect, it } from "vitest";
import { moveToStage, parseStageFilter, stagesFor, type StageFields } from "./stage";

const now = new Date("2026-10-05T09:00:00Z");
const fresh: StageFields = { stage: "not_applied", stageUpdatedAt: null, appliedAt: null };

describe("moveToStage", () => {
  it("records the applied date the first time it leaves Not applied", () => {
    expect(moveToStage(fresh, "applied", now)).toEqual({ stage: "applied", stageUpdatedAt: now, appliedAt: now });
  });

  it("keeps the original applied date on later moves", () => {
    const earlier = new Date("2026-10-01T00:00:00Z");
    const next = moveToStage({ stage: "applied", stageUpdatedAt: earlier, appliedAt: earlier }, "interviewing", now);
    expect(next).toEqual({ stage: "interviewing", stageUpdatedAt: now, appliedAt: earlier });
  });

  it("counts any stage past Not applied as applied", () => {
    expect(moveToStage(fresh, "rejected", now).appliedAt).toEqual(now);
  });

  it("counts a technical assessment as applied too", () => {
    expect(moveToStage(fresh, "technical_assessment", now)).toEqual({
      stage: "technical_assessment",
      stageUpdatedAt: now,
      appliedAt: now,
    });
  });

  it("changes nothing when the stage is the same", () => {
    expect(moveToStage(fresh, "not_applied", now)).toBe(fresh);
  });
});

describe("stage filters", () => {
  it("maps each filter to its stages", () => {
    expect(stagesFor("all")).toBeNull();
    expect(stagesFor("closed")).toEqual(["rejected", "withdrawn"]);
    expect(stagesFor("applied")).toEqual(["applied"]);
    expect(stagesFor("technical_assessment")).toEqual(["technical_assessment"]);
  });

  it("falls back to all for anything unknown", () => {
    expect(parseStageFilter("offer")).toBe("offer");
    expect(parseStageFilter("technical_assessment")).toBe("technical_assessment");
    expect(parseStageFilter("rejected")).toBe("all");
    expect(parseStageFilter(undefined)).toBe("all");
  });
});

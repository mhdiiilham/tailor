import { describe, expect, it } from "vitest";
import { ProfileSchema } from "./profile";
import { checkTerms, findUnbackedTerms, looksComplete, profileTerms } from "./techTerms";

const profile = ProfileSchema.parse({
  personal: { name: "Ada" },
  skills: { languages: ["Go", "TypeScript"], databases: ["PostgreSQL", "Redis"] },
  projects: [{ name: "x", tech: ["NATS", "Go"] }],
});

describe("profileTerms", () => {
  it("collects skills and project tech without repeats", () => {
    expect(profileTerms(profile)).toEqual(["Go", "TypeScript", "PostgreSQL", "Redis", "NATS"]);
  });
});

describe("checkTerms", () => {
  const terms = profileTerms(profile);

  it("splits mentioned terms by whether the profile has them", () => {
    const jd = "You'll build services in Go on Kubernetes, with PostgreSQL and Kafka. Experience with gRPC is a plus.";
    expect(checkTerms(jd, terms)).toEqual({ inProfile: ["Go", "PostgreSQL"], notInProfile: ["gRPC", "Kafka", "Kubernetes"] });
  });

  it("treats aliases as the same term", () => {
    expect(checkTerms("Golang and Postgres experience", terms).inProfile).toEqual(["Go", "PostgreSQL"]);
  });

  it("does not count the verb 'go' or partial words", () => {
    expect(checkTerms("Ready to go? We use Redistribution tooling.", terms)).toEqual({ inProfile: [], notInProfile: [] });
  });

  it("matches terms with symbols", () => {
    expect(checkTerms("C++ and Node.js, CI/CD pipelines", []).notInProfile).toEqual(["C++", "Node.js", "CI/CD"]);
  });
});

describe("looksComplete", () => {
  it("flags short pastes and missing requirement sections", () => {
    expect(looksComplete("Backend engineer")).toEqual({ tooShort: true, noRequirements: true });
    expect(looksComplete("x".repeat(200) + " Requirements: Go").tooShort).toBe(false);
    expect(looksComplete("x".repeat(200) + " Requirements: Go").noRequirements).toBe(false);
  });
});

describe("findUnbackedTerms", () => {
  const source = "Ran Go services on K8s with gRPC. Migrated a Rails monolith.";

  it("flags a tech term the source never mentions", () => {
    expect(findUnbackedTerms("Ran Go services and provisioned them with Terraform", source)).toEqual(["Terraform"]);
  });

  it("treats spellings of the same thing as one", () => {
    expect(findUnbackedTerms("Operated Kubernetes clusters over gRPC", source)).toEqual([]);
  });

  it("ignores a plain verb that is not a tech term", () => {
    expect(findUnbackedTerms("Let the team go home early", source)).toEqual([]);
  });
});

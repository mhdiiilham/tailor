import { describe, expect, it } from "vitest";
import { hnPostPath, hnText, isHiringThread, parseHnPostId, safeUrl, threadMonth } from "./hn";

describe("hnText", () => {
  it("turns HN comment HTML into plain text with paragraphs and full link targets", () => {
    const html =
      'Acme | Backend Engineer | REMOTE<p>We build <i>payments</i>. Apply: <a href="https:&#x2F;&#x2F;acme.com&#x2F;jobs&#x2F;123" rel="nofollow">https:&#x2F;&#x2F;acme.com&#x2F;jo...</a><p>Stack: Go &amp; Postgres, isn&#x27;t "legacy"';
    expect(hnText(html)).toBe(
      'Acme | Backend Engineer | REMOTE\n\nWe build payments. Apply: https://acme.com/jobs/123\n\nStack: Go & Postgres, isn\'t "legacy"',
    );
  });

  it("keeps code blocks and drops any other markup", () => {
    expect(hnText("Try:<p><pre><code>  go run .\n</code></pre><script>x</script>done")).toBe(
      "Try:\n\n  go run .\nxdone",
    );
  });
});

describe("isHiringThread", () => {
  it("matches the monthly hiring thread only", () => {
    expect(isHiringThread("Ask HN: Who is hiring? (October 2026)")).toBe(true);
    expect(isHiringThread("Ask HN: Who wants to be hired? (October 2026)")).toBe(false);
    expect(isHiringThread("Ask HN: Freelancer? Seeking freelancer? (October 2026)")).toBe(false);
  });
});

describe("safeUrl", () => {
  it("keeps http(s) links and drops anything else", () => {
    expect(safeUrl("https://acme.com/jobs")).toBe("https://acme.com/jobs");
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("acme.com/jobs")).toBe("");
    expect(safeUrl("")).toBe("");
  });
});

describe("threadMonth", () => {
  it("takes the month from the thread title", () => {
    expect(threadMonth("Ask HN: Who is hiring? (October 2026)")).toBe("October 2026");
    expect(threadMonth("Ask HN: Who is hiring?")).toBe("Ask HN: Who is hiring?");
  });
});

describe("parseHnPostId", () => {
  it("reads a plain post id", () => {
    expect(parseHnPostId("45123456")).toBe(45123456);
  });

  it("rejects anything that isn't a positive whole number", () => {
    for (const raw of ["", "0", "-5", "1.5", "12abc", "abc", " 12", "1e3", "99999999999999999999"]) {
      expect(parseHnPostId(raw)).toBeNull();
    }
  });
});

describe("hnPostPath", () => {
  it("is the page a post can be shared at", () => {
    expect(hnPostPath(45123456)).toBe("/hiring/45123456");
  });
});

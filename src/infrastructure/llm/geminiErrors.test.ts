import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { InvalidApiKeyError, RateLimitedError, scrubSecret } from "@/domain/errors";
import { classifyGeminiError } from "./geminiErrors";

const apiError = (statusCode: number, responseBody: string) =>
  new APICallError({ message: "failed", url: "https://example.test", requestBodyValues: {}, statusCode, responseBody });

describe("classifyGeminiError", () => {
  it("maps a per-minute 429 to a short wait", () => {
    const err = classifyGeminiError(apiError(429, '{"error":{"status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]}}'));
    expect(err).toBeInstanceOf(RateLimitedError);
    expect((err as RateLimitedError).window).toBe("minute");
  });

  it("maps a per-day 429 to the daily limit", () => {
    const err = classifyGeminiError(apiError(429, '{"details":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}'));
    expect((err as RateLimitedError).window).toBe("day");
  });

  it("looks inside RetryError after retries are exhausted", () => {
    const retry = new RetryError({ message: "gave up", reason: "maxRetriesExceeded", errors: [apiError(429, "{}")] });
    expect(classifyGeminiError(retry)).toBeInstanceOf(RateLimitedError);
  });

  it("maps a bad key", () => {
    expect(classifyGeminiError(apiError(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}'))).toBeInstanceOf(
      InvalidApiKeyError,
    );
    expect(classifyGeminiError(apiError(403, "{}"))).toBeInstanceOf(InvalidApiKeyError);
  });

  it("passes other errors through", () => {
    const other = apiError(500, "{}");
    expect(classifyGeminiError(other)).toBe(other);
  });
});

describe("scrubSecret", () => {
  it("removes every occurrence of the key", () => {
    expect(scrubSecret("bad key AIzaSyFAKEKEY123 in AIzaSyFAKEKEY123", "AIzaSyFAKEKEY123")).toBe(
      "bad key [redacted] in [redacted]",
    );
  });

  it("leaves text alone without a key", () => {
    expect(scrubSecret("hello", undefined)).toBe("hello");
  });
});

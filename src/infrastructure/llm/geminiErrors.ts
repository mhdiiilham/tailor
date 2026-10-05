import { APICallError, RetryError } from "ai";
import { GeminiUnreachableError, InvalidApiKeyError, RateLimitedError, scrubSecret } from "@/domain/errors";

function lastApiError(err: unknown): APICallError | null {
  if (RetryError.isInstance(err)) return lastApiError(err.lastError);
  return APICallError.isInstance(err) ? err : null;
}

// Turns Gemini API failures into errors a person can act on.
export function classifyGeminiError(err: unknown): unknown {
  const api = lastApiError(err);
  if (!api) return err;
  // No status code: the request never got an answer (offline, blocked by an extension or firewall).
  if (api.statusCode === undefined) return new GeminiUnreachableError();
  const body = `${api.responseBody ?? ""} ${api.message}`;

  if (api.statusCode === 429) {
    return new RateLimitedError(/PerDay/i.test(body) ? "day" : "minute");
  }
  if (
    api.statusCode === 401 ||
    api.statusCode === 403 ||
    /API_KEY_INVALID|API key not valid|API key expired/i.test(body)
  ) {
    return new InvalidApiKeyError();
  }
  return err;
}

// The text to show for a failed AI step, with the key removed in case any message repeats it.
export function describeAiFailure(err: unknown, key?: string): string {
  const classified = classifyGeminiError(err);
  const message = classified instanceof Error ? classified.message : "Something went wrong.";
  return scrubSecret(message, key);
}

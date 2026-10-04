import { APICallError, RetryError } from "ai";
import { InvalidApiKeyError, RateLimitedError } from "@/domain/errors";

function lastApiError(err: unknown): APICallError | null {
  if (RetryError.isInstance(err)) return lastApiError(err.lastError);
  return APICallError.isInstance(err) ? err : null;
}

// Turns Gemini API failures into errors a person can act on.
export function classifyGeminiError(err: unknown): unknown {
  const api = lastApiError(err);
  if (!api) return err;
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

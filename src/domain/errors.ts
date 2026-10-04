// Errors the UI can explain to a person. Anything else is shown as a generic failure.

export class MissingApiKeyError extends Error {
  constructor() {
    super("Add your Gemini API key in Settings first.");
  }
}

export class InvalidApiKeyError extends Error {
  constructor() {
    super("Google rejected your Gemini API key. Check it in Settings.");
  }
}

export class RateLimitedError extends Error {
  constructor(readonly window: "minute" | "day") {
    super(
      window === "day"
        ? "Your Gemini daily limit is used up. It resets tomorrow, or add billing to your Google AI Studio project."
        : "Gemini is rate limiting your key right now. Wait a minute and try again.",
    );
  }
}

// Removes a secret from any text before it can reach a log or the browser.
export function scrubSecret(text: string, secret: string | undefined): string {
  if (!secret || secret.length < 8) return text;
  return text.split(secret).join("[redacted]");
}

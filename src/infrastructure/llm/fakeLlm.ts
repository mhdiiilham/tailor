import type { GenerateObjectRequest, LlmPort } from "@/domain/ports";

// Test double: returns queued responses in order and records every request.
export class FakeLlm implements LlmPort {
  readonly requests: GenerateObjectRequest<unknown>[] = [];

  constructor(private readonly responses: unknown[]) {}

  async generateObject<T>(req: GenerateObjectRequest<T>): Promise<T> {
    this.requests.push(req as GenerateObjectRequest<unknown>);
    if (this.responses.length === 0) throw new Error("FakeLlm: no response queued");
    return req.schema.parse(this.responses.shift());
  }
}

import type { HnClient, HnItem } from "@/domain/ports";

const API = "https://hacker-news.firebaseio.com/v0";
const TIMEOUT_MS = 10_000;

// The official Hacker News API: public, no key. https://github.com/HackerNews/API
export class HnApiClient implements HnClient {
  async item(id: number): Promise<HnItem | null> {
    return this.get<HnItem>(`${API}/item/${id}.json`);
  }

  async submissions(user: string): Promise<number[]> {
    const data = await this.get<{ submitted?: number[] }>(`${API}/user/${encodeURIComponent(user)}.json`);
    return data?.submitted ?? [];
  }

  private async get<T>(url: string): Promise<T | null> {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Hacker News API returned ${res.status} for ${url}`);
    return (await res.json()) as T | null;
  }
}

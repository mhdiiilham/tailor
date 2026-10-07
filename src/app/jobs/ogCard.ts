import { hnPostTitle, type HnPost } from "@/domain/hn";
import { MODE_LABEL } from "./shared";

// What the share image of one job shows. Short on purpose: the image is small and a
// post's fields can hold whole sentences.
export type OgCard = { title: string; company: string; facts: string[]; stack: string[] };

const clamp = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function ogCard(post: HnPost): OgCard {
  const job = post.job;
  // Parsed posts are titled by role alone; the company has its own line.
  const title = job?.role || hnPostTitle(post.text, job);
  // "Remote" next to "REMOTE (US)" would say the same thing twice.
  const mode =
    job && !job.location.toLowerCase().includes(MODE_LABEL[job.workMode].toLowerCase()) ? MODE_LABEL[job.workMode] : "";
  return {
    title: clamp(title, 110),
    company: clamp(job?.role ? job.company : "", 60),
    facts: job ? [mode, job.location, job.salary].filter(Boolean).map((fact) => clamp(fact, 40)) : [],
    stack: job?.techStack.slice(0, 6) ?? [],
  };
}

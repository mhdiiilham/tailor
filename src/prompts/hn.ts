// Turns raw "Who is hiring?" posts into structured fields. Runs on the server with
// Gemini 2.5 Flash-Lite, in batches; see application/hnSync.ts.
export const HN_PARSE_SYSTEM = `You extract job details from Hacker News "Who is hiring?" posts.
Each post starts with "POST <id>:". Return one entry per post, with that exact id.

Rules:
- Use only what the post says. Never guess; use an empty string (or "unknown" for workMode) when it isn't stated.
- company: the hiring company's name.
- role: the role title(s) as written; join several with ", ".
- location: places and region limits as written, e.g. "Remote (US/EU)", "Berlin or Remote".
- workMode: "remote" if remote is allowed, "hybrid" if it says hybrid, "onsite" if only onsite, else "unknown".
- salary: pay or equity as written, e.g. "$150k-$190k + equity".
- techStack: languages, frameworks, databases and tools named in the post, at most 12, short names.
- applyUrl: the application or careers URL in the post, else an empty string.`;

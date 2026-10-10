import type { Profile } from "./profile";

// Common terms looked for in a pasted job description, on top of whatever is in
// the profile. Only used for the quick local check before any AI call.
export const COMMON_TECH_TERMS = [
  "Go", "Golang", "Rust", "Java", "Kotlin", "Scala", "Python", "Ruby", "PHP", "C#", "C++", "Elixir",
  "JavaScript", "TypeScript", "Node.js", "React", "Next.js", "Vue", "Angular", "Svelte",
  "gRPC", "GraphQL", "REST", "Protobuf", "WebSockets",
  "PostgreSQL", "MySQL", "MariaDB", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Elasticsearch", "ClickHouse", "SQLite",
  "Kafka", "RabbitMQ", "NATS", "Pub/Sub", "SQS", "Kinesis",
  "Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "AWS", "GCP", "Azure", "Linux",
  "CI/CD", "GitHub Actions", "Jenkins", "ArgoCD",
  "Prometheus", "Grafana", "OpenTelemetry", "Datadog", "Sentry",
  "Microservices", "Distributed Systems", "Event-Driven", "DDD", "TDD",
];

// Different spellings of the same thing, all lowercase.
const ALIASES: Record<string, string> = {
  golang: "go",
  postgres: "postgresql",
  k8s: "kubernetes",
  js: "javascript",
  ts: "typescript",
  node: "node.js",
  nodejs: "node.js",
  "google cloud": "gcp",
  "amazon web services": "aws",
};

// Aliases searched for in the text. "js", "ts" and "node" are too ambiguous on their own
// ("Node.js" contains "js"), so they only normalize names.
const SCANNED_ALIASES = Object.keys(ALIASES).filter((a) => !["js", "ts", "node"].includes(a));

const canonical = (term: string) => ALIASES[term.toLowerCase()] ?? term.toLowerCase();

function escape(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

// Very short terms ("Go") only match with their capitalization, so the verb "go" doesn't count.
function appearsIn(text: string, term: string): boolean {
  const flags = term.length <= 2 ? "" : "i";
  return new RegExp(`(^|[^A-Za-z0-9+#])${escape(term)}(?![A-Za-z0-9+#])`, flags).test(text);
}

export function profileTerms(profile: Profile): string[] {
  const fromSkills = Object.values(profile.skills).flat();
  const fromProjects = profile.projects.flatMap((p) => p.tech);
  return [...new Set([...fromSkills, ...fromProjects])];
}

export type TermCheck = { inProfile: string[]; notInProfile: string[] };

// Which tech terms the posting mentions, split by whether the profile has them.
export function checkTerms(jd: string, profileTermList: string[]): TermCheck {
  // Shown with the profile's own spelling when the profile has the term.
  const profileSpelling = new Map(profileTermList.map((t) => [canonical(t), t]));
  const seen = new Set<string>();
  const inProfile: string[] = [];
  const notInProfile: string[] = [];
  for (const term of [...profileTermList, ...COMMON_TECH_TERMS, ...SCANNED_ALIASES]) {
    const key = canonical(term);
    if (seen.has(key) || !appearsIn(jd, term)) continue;
    seen.add(key);
    const known = profileSpelling.get(key);
    if (known) inProfile.push(known);
    else notInProfile.push(term);
  }
  return { inProfile, notInProfile };
}

// Tech terms a bullet names that its own source never mentions, e.g. "Terraform" in a role
// whose highlights don't. Spellings that mean the same thing (k8s, Kubernetes) count as one.
export function findUnbackedTerms(text: string, source: string): string[] {
  const backed = new Set(checkTerms(source, []).notInProfile.map(canonical));
  return checkTerms(text, []).notInProfile.filter((t) => !backed.has(canonical(t)));
}

// Rough size check so obviously incomplete pastes are caught before spending a call.
export function looksComplete(jd: string): { tooShort: boolean; noRequirements: boolean } {
  return {
    tooShort: jd.trim().length < 200,
    noRequirements: !/requirement|qualification|you have|you will|must have|what we.re looking for|experience with/i.test(jd),
  };
}

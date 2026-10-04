// Docs for each part of profile.yaml, shown beside the editor. The template is
// built from these examples, and a test checks that it passes validation.

export type GuideSection = {
  key: string;
  title: string;
  need: "Required" | "Recommended" | "Optional";
  points: string[];
  example: string;
};

export const PROFILE_GUIDE: GuideSection[] = [
  {
    key: "personal",
    title: "Contact details",
    need: "Required",
    points: [
      "Only `name` is required. Everything else is optional and shows in the resume header when filled in.",
      "Write links without https://, e.g. `github.com/you`.",
    ],
    example: `personal:
  name: "Your Name"
  email: "you@example.com"
  phone: "+62 812 0000 0000"
  location: "Jakarta, Indonesia"
  linkedin: "linkedin.com/in/you"
  github: "github.com/you"
  portfolio: "you.dev"`,
  },
  {
    key: "availability",
    title: "Availability line",
    need: "Optional",
    points: ["A short italic line under your name: timezone, remote or relocation, notice period."],
    example: `availability: "Based in Jakarta (UTC+7). Open to remote work and relocation."`,
  },
  {
    key: "summary",
    title: "Summary",
    need: "Recommended",
    points: [
      "Two or three sentences about what you do. Tailor rewrites it for each job, so this is raw material, not the final text.",
    ],
    example: `summary: |
  Backend engineer working in Go and PostgreSQL on payments systems.
  I like owning a service end to end, from design to on-call.`,
  },
  {
    key: "experience",
    title: "Work experience",
    need: "Required",
    points: [
      "Newest first. `start` and `end` are `YYYY-MM`; use `present` for a current role.",
      "Titles, companies and dates are copied to the resume exactly as written here.",
      "`highlights` are what every bullet is built from. One achievement per line, with a number or scale where you can (time saved, traffic, users, money).",
      "Write more highlights than fit on a page. Tailor picks the ones that match each job and leaves the rest out.",
    ],
    example: `experience:
  - title: "Backend Engineer"
    company: "Example Co"
    location: "Remote"
    start: "2022-03"
    end: "present"
    highlights:
      - "Cut settlement reconciliation from 3 hours to 12 minutes by batching ledger queries."
      - "Designed the retry and idempotency layer for payment webhooks."
  - title: "Software Engineer"
    company: "Previous Co"
    location: "Jakarta, Indonesia"
    start: "2019-07"
    end: "2022-02"
    highlights:
      - "Built the order webhook pipeline that handled 40k events a day."`,
  },
  {
    key: "projects",
    title: "Projects",
    need: "Optional",
    points: [
      "Side projects, freelance work or open source. Up to three can appear on a resume.",
      "`tech` lists what it's built with. `highlights` work like they do for experience.",
      "Add `start` and `end` (YYYY-MM) to show dates. The link appears on the resume only when dates are set.",
    ],
    example: `projects:
  - name: "pgbatch"
    description: "Small Go library for batching Postgres writes."
    url: "github.com/you/pgbatch"
    tech: ["Go", "PostgreSQL"]
    start: "2024-01"
    end: "present"
    highlights:
      - "Used in production by two companies to cut write load."`,
  },
  {
    key: "education",
    title: "Education",
    need: "Optional",
    points: ["Degrees, bootcamps or courses. `year` is the year you finished."],
    example: `education:
  - degree: "BSc Computer Science"
    institution: "Example University"
    location: "Bandung, Indonesia"
    year: 2019`,
  },
  {
    key: "skills",
    title: "Skills",
    need: "Recommended",
    points: [
      "Group them under any category names you like.",
      "Only skills listed here (or in your experience and projects) can appear on a resume.",
      "The New application page uses this list to show which tech in a posting you already have.",
    ],
    example: `skills:
  languages: ["Go", "TypeScript", "SQL"]
  databases: ["PostgreSQL", "Redis"]
  infrastructure: ["Docker", "Kubernetes", "AWS"]
  practices: ["TDD", "Code review"]`,
  },
  {
    key: "spoken_languages",
    title: "Spoken languages",
    need: "Optional",
    points: ["Shown as a line at the bottom of the skills section."],
    example: `spoken_languages: ["Indonesian (native)", "English (professional)"]`,
  },
  {
    key: "certifications",
    title: "Certifications",
    need: "Optional",
    points: ["Used when matching you against a job. They aren't printed as their own resume section yet."],
    example: `certifications: ["AWS Certified Developer - Associate (2024)"]`,
  },
  {
    key: "writing_style",
    title: "Writing style",
    need: "Recommended",
    points: [
      "`voice_sample`: a paragraph in your own words. The summary is written to sound like it.",
      "`avoid_mentioning`: things that must never appear, e.g. a former employer you'd rather not name.",
      "`always_include_if_relevant`: things to bring up whenever they fit, e.g. that you're open to relocation.",
    ],
    example: `writing_style:
  voice_sample: |
    I've been building backend systems for six years, mostly in Go.
    I care about code the next person can read at 3am.
  avoid_mentioning: []
  always_include_if_relevant:
    - "Open to relocation"`,
  },
];

export const PROFILE_TEMPLATE = [
  "# Your profile. Every resume is built only from what's here.",
  "# Replace the example values with your own, then press Save.",
  "",
  ...PROFILE_GUIDE.map((s) => `# ${s.title} (${s.need.toLowerCase()})\n${s.example}\n`),
].join("\n");

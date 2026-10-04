import type { Profile } from "@/domain/profile";
import type { TailoredResume } from "@/domain/resume";
import { stripEmDashes } from "@/domain/writing";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Text placed in Typst markup (bullets, summary).
export function escapeMarkup(text: string): string {
  return stripEmDashes(text)
    .replace(/[\\#$*_@<>[\]`~]/g, (c) => `\\${c}`)
    .replace(/\/\//g, "\\/\\/");
}

// Text placed inside a Typst "string" argument.
export function escapeString(text: string): string {
  return stripEmDashes(text).replace(/[\\"]/g, (c) => `\\${c}`);
}

export function formatMonth(value: string): string {
  if (value === "present") return "Present";
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

const str = (value: string) => `"${escapeString(value)}"`;

const dates = (start?: string, end?: string) =>
  start && end
    ? `dates-helper(start-date: ${str(formatMonth(start))}, end-date: ${str(formatMonth(end))})`
    : '""';

const bullets = (items: string[]) => items.map((b) => `- ${escapeMarkup(b)}`).join("\n");

function header(p: Profile): string {
  const { personal } = p;
  return `#import "@preview/basic-resume:0.2.9": *

#let name = ${str(personal.name)}
#let location = ${str(personal.location)}
#let email = ${str(personal.email)}
#let github = ${str(personal.github)}
#let linkedin = ${str(personal.linkedin)}
#let phone = ${str(personal.phone)}
#let personal-site = ${str(personal.portfolio)}

#show: resume.with(
  author: name,
  location: location,
  email: email,
  github: github,
  linkedin: linkedin,
  phone: phone,
  personal-site: personal-site,
  accent-color: "#26428b",
  font: "New Computer Modern",
  paper: "us-letter",
  author-position: left,
  personal-info-position: left,
)`;
}

function work(p: Profile, r: TailoredResume): string {
  return r.work
    .map(({ experienceIndex, bullets: items }) => {
      const e = p.experience[experienceIndex];
      if (!e) throw new Error(`resume references experience ${experienceIndex}, which is not in the profile`);
      return `#work(
  title: ${str(e.title)},
  location: ${str(e.location)},
  company: ${str(e.company)},
  dates: ${dates(e.start, e.end)},
)
${bullets(items)}`;
    })
    .join("\n\n");
}

function projects(p: Profile, r: TailoredResume): string {
  return r.projects
    .map(({ projectIndex, bullets: items }) => {
      const proj = p.projects[projectIndex];
      if (!proj) throw new Error(`resume references project ${projectIndex}, which is not in the profile`);
      return `#project(
  name: ${str(proj.name)},
  url: ${str(proj.url.replace(/^https?:\/\//, ""))},
  dates: ${dates(proj.start, proj.end)},
)
${bullets(items)}`;
    })
    .join("\n\n");
}

function education(p: Profile): string {
  return p.education
    .map(
      (e) => `#edu(
  institution: ${str(e.institution)},
  location: ${str(e.location)},
  dates: ${str(e.year)},
  degree: ${str(e.degree)},
)`,
    )
    .join("\n\n");
}

function skills(p: Profile, r: TailoredResume): string {
  const rows = r.skills.map(
    (s) => `- *${escapeMarkup(s.category)}*: ${s.items.map(escapeMarkup).join(", ")}`,
  );
  if (p.spoken_languages.length > 0) {
    rows.push(`- *Spoken Languages*: ${p.spoken_languages.map(escapeMarkup).join(", ")}`);
  }
  return rows.join("\n");
}

export function renderResumeTypst(profile: Profile, resume: TailoredResume): string {
  const sections = [header(profile)];
  if (profile.availability) sections.push(`_${escapeMarkup(profile.availability)}_`);
  if (resume.summary.trim()) sections.push(`== Summary\n\n${escapeMarkup(resume.summary.trim())}`);
  sections.push(`== Work Experience\n\n${work(profile, resume)}`);
  if (resume.projects.length > 0) sections.push(`== Projects\n\n${projects(profile, resume)}`);
  if (profile.education.length > 0) sections.push(`== Education\n\n${education(profile)}`);
  if (resume.skills.length > 0) sections.push(`== Skills\n${skills(profile, resume)}`);
  return sections.join("\n\n") + "\n";
}

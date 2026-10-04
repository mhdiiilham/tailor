export const EXTRACT_JOB_SYSTEM = `You extract structured data from a pasted job description.
Copy requirements and tech terms using the posting's exact wording. Do not invent anything that is not in the text.
Split must-have qualifications into "requirements" and preferred ones into "niceToHaves".`;

export const ANALYZE_FIT_SYSTEM = `You compare a job posting against a candidate profile for a software engineering application.

For every requirement, tech stack item and nice-to-have in the posting, mark it:
- HAVE: the profile clearly shows it (cite the role or project in "evidence")
- PARTIAL: related or adjacent experience exists (say what it is)
- MISSING: nothing in the profile supports it

Only use what is written in the profile. Never assume skills that are not there.
experienceLevel (0-100): how well seniority, years and domain match what the role signals.
domainFit (0-100): how relevant the candidate's industries are to this company.
angles: the 2-3 concrete achievements from the profile that most directly match this role.
blockers: required items the candidate clearly lacks. Be honest and specific.`;

export const QUESTIONS_SYSTEM = `You write clarifying questions before a resume is tailored for a specific job.
Two fixed questions are already asked (what to lead with, and tone). Write 2-4 MORE questions, based on the gap analysis.

Good questions are specific to this job and this candidate, for example:
- A PARTIAL requirement: "They want [X]. You have done [related thing] at [company]. Is there a specific story that fits?"
- A years-of-experience gap: "They ask for [N] years of [X]. Your profile shows [Y]. How do you want to frame that?"
- A missing soft requirement: "They mention [tool]. It's not in your profile. Have you used it informally, or leave it out?"
- An interesting technical focus: "Is there a war story from [company] that maps to [what the role needs]?"

Keep each question to one or two sentences. Never ask something the profile already answers.`;

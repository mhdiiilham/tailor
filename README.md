# Tailor

A local web app version of the `/tailored` workflow. Paste a job description, see how well you fit, answer a few questions, get a tailored resume PDF.

## Setup

Requires Node 22+ and [Typst](https://typst.app) on your PATH (`brew install typst`).

```bash
npm install
cp .env.example .env.local   # pick a provider and add a key
npm run seed:profile          # imports ../profile/profile.yaml into SQLite (or use the Profile page)
npm run dev                   # http://localhost:3000
```

PDFs are written to `../tailored/<company>_<role>/`, the same folders the `/tailored` skill uses.

## Choosing a model

Set `LLM_PROVIDER` in `.env.local`. Two model slots: `LLM_MODEL_FAST` (job extraction, fit analysis, questions) and `LLM_MODEL_WRITE` (the resume).

| Provider | `LLM_PROVIDER` | Notes |
|---|---|---|
| Claude | `anthropic` | Defaults to Haiku 4.5 (fast) and Sonnet 5.5 (write), roughly $0.05 to $0.10 per resume |
| Gemini | `google` | Has a free tier |
| Qwen, DeepSeek, OpenRouter, Ollama | `openai-compatible` | Set `LLM_BASE_URL`, `LLM_API_KEY` and both model names |

Every model call logs its token usage to the server console.

## Layout

```
src/domain/          entities, schemas, fit scoring, ports (no framework code)
src/application/     ApplicationService: start, generate, revise
src/infrastructure/  SQLite (Drizzle), AI SDK adapter, Typst renderer, YAML import
src/prompts/         prompts adapted from .claude/skills/tailored/SKILL.md
src/app/             Next.js pages and server actions
```

The model never writes Typst. It returns structured JSON that points at roles and projects by index, and `typstResume.ts` renders it, so titles, companies and dates always come from your profile.

## Database

SQLite at `./data/career.db`. Schema changes: edit `src/infrastructure/db/schema.ts`, then `npm run db:generate`. Migrations run on startup. Profiles and resumes are stored as JSON columns, which map to `jsonb` when moving to Postgres.

## Tests

```bash
npm test
```

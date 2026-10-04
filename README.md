# Tailor

Paste a job description, answer a few questions, download a tailored one-page resume PDF. A web version of the `/tailored` resume workflow, for a small invite-only group.

- **Sign in with Google**, limited to the emails in `ALLOWED_EMAILS`.
- **Bring your own key:** each person adds their own Gemini API key in Settings. It's kept in that browser's `localStorage`, sent with each AI request, and never stored on the server. Guide: https://ai.google.dev/gemini-api/docs/api-key
- Each person has their own profile and applications.

## Run locally

Requires Node 22+ and [Typst](https://typst.app) (`brew install typst`).

```bash
npm install
cp .env.example .env.local   # fill in auth settings (see Google OAuth below)
docker run -d --name tailor-pg -p 5432:5432 -e POSTGRES_USER=tailor -e POSTGRES_PASSWORD=tailor postgres:17
npm run dev                  # http://localhost:3000, migrations run on start
```

## Google OAuth client

1. Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
2. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
3. Put the client ID and secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Deploy on Coolify

The image is built by GitHub Actions (`.github/workflows/tailor-image.yml`) on every push to `main`. It runs typecheck, lint and tests, then pushes `ghcr.io/<github-user>/tailor:latest` (plus a `sha-xxxxxxx` tag). Coolify only pulls and runs it.

1. Push to `main` once so the image exists. If the GitHub package is private, log the Coolify server in to GHCR with a token that has `read:packages`:
   `echo <token> | docker login ghcr.io -u <github-user> --password-stdin`
2. In Coolify: New resource > **Docker Image** > `ghcr.io/<github-user>/tailor:latest`.
3. Port **3000**. The image has a `HEALTHCHECK` against `/api/health`, which Coolify picks up.
4. Database: add a **PostgreSQL** resource in the same Coolify project and copy its internal connection URL. Migrations run when the app starts.
5. Environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your https domain), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`. No Gemini key on the server.
6. Add `https://<your-domain>/api/auth/callback/google` to the Google OAuth client, then deploy.
7. Optional auto-deploy: in the GitHub repo add secrets `COOLIFY_WEBHOOK` (the resource's deploy webhook URL) and `COOLIFY_TOKEN` (a Coolify API token). The workflow then triggers a redeploy after each push.

Back up the Postgres database (Coolify can schedule backups for its database resources). Typst 0.15.1 and the resume template package are baked into the image, so PDF builds don't download anything at runtime. Building the image needs about 1.5 GB of RAM, which is why it happens in GitHub Actions rather than on the server.

## Models and cost

Two Gemini models: `GEMINI_MODEL_FAST` (job extraction, fit analysis, questions) and `GEMINI_MODEL_WRITE` (the resume). The free tier costs nothing; on a paid key a resume is a few cents. Each model call logs its token usage to the server console.

## Layout

```
src/domain/          entities, schemas, fit scoring, allowlist, errors, ports (no framework code)
src/application/     ApplicationService: start, generate, revise (per user)
src/infrastructure/  Postgres (Drizzle), Better Auth, Gemini adapter, Typst renderer, YAML parsing
src/prompts/         prompts adapted from the /tailored Claude Code skill
src/components/ui/   Button, Card, EmptyState, Field, TextArea, PageHeader, ...
src/app/             pages, server actions, auth/health/PDF routes
```

The model never writes Typst. It returns structured JSON that points at your roles and projects by index, and `typstResume.ts` renders it, so titles, companies and dates always come from your profile.

## Database

Postgres via Drizzle (`DATABASE_URL`). Schema changes: edit `src/infrastructure/db/schema.ts`, then `npm run db:generate`; migrations in `drizzle/` run on server start (`src/instrumentation.ts`). Profiles and resumes are `jsonb`, PDFs `bytea`. Tests use PGlite (Postgres in-process), so `npm test` needs no database server.

## Tests

```bash
npm test
```

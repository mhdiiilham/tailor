# Tailor

Paste a job description, answer a few questions, and download a one-page resume tailored to that job. Tailor also tracks where each application stands, from "Not applied" to "Offer".

- **Bring your own key.** Each person adds their own Gemini API key in Settings. It stays in their browser and is sent with each AI request; the server never stores it.
- **Nothing invented.** The AI picks and rewrites from your profile only. Titles, companies and dates are copied from it, never generated.
- **Open or private.** Google sign-in, open to anyone or limited to the emails you list.
- **Small footprint.** One Next.js container, one Postgres database, Typst for the PDFs.

This README is for running your own copy.

---

## Contents

- [What you need](#what-you-need)
- [1. Create a Google OAuth client](#1-create-a-google-oauth-client)
- [2. Configure](#2-configure)
- [3. Deploy](#3-deploy) (Docker Compose, Coolify, any container host)
- [4. Make it yours (legal pages)](#4-make-it-yours-legal-pages)
- [Running it](#running-it) (updates, backups, logs)
- [Develop locally](#develop-locally)
- [How it works](#how-it-works)

---

## What you need

- A server or platform that runs Docker containers. Running the app is light, but **building the image needs about 1.5 GB of RAM**, so on a small server build it elsewhere (for example with the included GitHub Actions workflow).
- **PostgreSQL** (tested with 17). The Compose file includes one.
- A **domain with HTTPS**. Google sign-in and the secure cookies need it.
- A **Google Cloud project** for the OAuth client (free).
- Each user needs their own **Gemini API key** ([how to get one](https://ai.google.dev/gemini-api/docs/api-key)). The free tier works.

## 1. Create a Google OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **OAuth consent screen**, and set it up (External, app name, your email). While it's in "Testing" mode, add your users as test users, or publish it.
2. Go to **Credentials** > **Create credentials** > **OAuth client ID** > **Web application**.
3. Under **Authorized redirect URIs**, add exactly:
   - `https://<your-domain>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (only for local development)
4. Copy the client ID and secret.

If sign-in fails with `redirect_uri_mismatch`, the URI above doesn't exactly match `BETTER_AUTH_URL` + `/api/auth/callback/google`. Check `http` vs `https`, `www`, the port, and trailing slashes.

## 2. Configure

Copy `.env.example` to `.env` (Docker) or `.env.local` (local development) and fill it in:

| Variable | Required | What it is |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Random secret that signs sessions. Generate one with `openssl rand -base64 32`. Changing it signs everyone out. |
| `BETTER_AUTH_URL` | yes | Public URL of your instance, e.g. `https://tailor.example.com`. No trailing slash. |
| `GOOGLE_CLIENT_ID` | yes | From step 1. |
| `GOOGLE_CLIENT_SECRET` | yes | From step 1. |
| `ALLOWED_EMAILS` | yes | Who may sign in. `*` lets anyone with a Google account in. Otherwise a comma-separated list of emails; everyone else is refused. Empty means nobody, so a missing value never opens the app by accident. Changes apply after a restart. |
| `DATABASE_URL` | yes | Postgres connection string. Docker Compose sets it for you. |
| `POSTGRES_PASSWORD` | Compose only | Password for the bundled Postgres in `docker-compose.yml`. |
| `GEMINI_MODEL_FAST` | no | Model for reading the job post, fit analysis and questions. Default `gemini-flash-lite-latest`. |
| `GEMINI_MODEL_WRITE` | no | Model that writes the resume. Default `gemini-flash-latest`. |
| `TYPST_BIN` | no | Path to the Typst binary. Default `typst`; already in the Docker image. |

No Gemini key goes here. Users add their own in the app.

Never commit `.env` or put real values in `.env.example`.

## 3. Deploy

Database migrations run automatically every time the app starts, so a fresh database needs no setup.

### Option A: Docker Compose (any VPS)

```bash
git clone https://github.com/<github-user>/tailor.git && cd tailor
cp .env.example .env        # fill in the table above, including POSTGRES_PASSWORD
docker compose up -d --build
```

The app listens on port **3000**. Put a reverse proxy with HTTPS in front of it, such as Caddy, Traefik or nginx. With Caddy it's one line in the Caddyfile:

```
tailor.example.com {
  reverse_proxy localhost:3000
}
```

Then open your domain, tick the 18+ box, and sign in with an allowed Google account.

### Option B: Coolify

1. Add a **PostgreSQL** resource to your project and copy its internal connection URL.
2. Add the app, either way:
   - **Build on the server:** New resource > your Git repository > build pack **Dockerfile**. Needs about 2 GB of RAM while building.
   - **Use a prebuilt image:** New resource > **Docker Image** > `ghcr.io/<github-user>/tailor:latest`. See [Prebuilt images](#prebuilt-images-with-github-actions).
3. Port **3000**. The image's `HEALTHCHECK` (`/api/health`) is picked up automatically.
4. Set the environment variables from step 2, with `DATABASE_URL` set to the Postgres URL from step 1.
5. Set your domain, make sure the Google redirect URI matches it, and deploy.

### Option C: Any container host

Fly.io, Railway, Render, Kubernetes and similar all work: run the image, set the environment variables, point `DATABASE_URL` at a Postgres database, expose port 3000, and use `/api/health` as the health check. Run one instance; the PDF cleanup job runs inside the app process.

### Prebuilt images with GitHub Actions

`.github/workflows/tailor-image.yml` runs on every push to `main`. It typechecks, lints, runs the tests, then builds and pushes `ghcr.io/<github-user>/tailor:latest` and a `sha-xxxxxxx` tag. Building there means a small server never has to build.

- If the package is private, log your server in once: `echo <token> | docker login ghcr.io -u <github-user> --password-stdin`, using a token with `read:packages`.
- Optional auto-deploy to Coolify: add repository secrets `COOLIFY_WEBHOOK` (the resource's deploy webhook URL) and `COOLIFY_TOKEN` (a Coolify API token).
- The image is built for `linux/amd64`. For an ARM server, add `linux/arm64` to `platforms` in the workflow.

## 4. Make it yours (legal pages)

The Privacy Policy and Terms describe one specific deployment: who runs it, the contact email, the hosting provider, and Indonesian law (UU PDP). **If you run your own instance, edit them before inviting anyone:**

- `src/components/legal/legalPage.tsx`: contact email and "last updated" date.
- `src/app/privacy/page.tsx`: who runs it, hosting provider and location, and the rights section for your country.
- `src/app/terms/page.tsx`: who runs it and the governing law.
- `src/app/layout.tsx`: the footer contact link.

Then build your own image. A prebuilt image from someone else carries their details. The documents describe what the code does (two sign-in cookies, PDFs deleted after 24 hours, keys never stored), so keep them accurate if you change that behavior. This isn't legal advice; have them reviewed if you open your instance to the public.

## Running it

- **Updating:** pull and rebuild (`docker compose up -d --build`), or redeploy the new image. Migrations run on start.
- **Backups:** back up Postgres, for example with `pg_dump` or your platform's scheduled backups. That's the only state. PDFs are stored in the database and deleted after 24 hours anyway.
- **Health:** `GET /api/health` returns `{"status":"ok"}` when the database answers.
- **Logs:** each Gemini call logs the model, input and output tokens, and duration (`[llm] ...`). The PDF cleanup logs `[retention] ...`. Gemini keys are scrubbed from error logs.
- **Users:** open sign-up with `ALLOWED_EMAILS=*`, or list emails and restart to add or remove people. People can delete their own account and all its data in Settings.
- **Cost:** on Gemini's free tier, nothing. On a paid key a resume costs a few cents. Each user pays for their own key.

## Develop locally

Requires Node 22+ and [Typst](https://typst.app) (`brew install typst`).

```bash
npm install
cp .env.example .env.local   # BETTER_AUTH_URL=http://localhost:3000, plus Google client and ALLOWED_EMAILS
docker run -d --name tailor-pg -p 5432:5432 -e POSTGRES_USER=tailor -e POSTGRES_PASSWORD=tailor postgres:17
npm run dev                  # http://localhost:3000
```

```bash
npm test           # unit and repository tests; Postgres runs in-process (PGlite), no server needed
npx tsc --noEmit   # typecheck
npm run lint
```

Schema changes: edit `src/infrastructure/db/schema.ts`, then `npm run db:generate` to create a migration in `drizzle/`.

## How it works

1. **Paste a job description.** A quick check in the browser shows which tech it mentions is or isn't in your profile.
2. **Fit analysis.** Gemini extracts the requirements and matches each against your profile. The score is computed in code from those matches (40% requirements, 25% stack, 20% seniority, 10% nice-to-haves, 5% domain).
3. **Questions.** Two fixed questions, plus two to four about your gaps.
4. **Resume.** Gemini returns structured JSON that points at your roles and projects by index. `src/infrastructure/typst/typstResume.ts` turns it into Typst and compiles a PDF, so titles, companies and dates always come from your profile. Banned buzzwords trigger one rewrite, and em dashes are removed.
5. **Track it.** Set the stage (Not applied, Applied, Interviewing, Offer, Rejected, Withdrawn); the applied date is recorded automatically.

**What's stored:** per user, the profile, and per application the job description, answers, analysis, resume content, Typst source and stage. PDFs are deleted 24 hours after they're made and rebuilt from the Typst source if downloaded later. People can delete an application or their whole account at any time.

```
src/domain/          entities, schemas, fit scoring, stages, retention, allowlist (no framework code)
src/application/     use cases: ApplicationService (start, generate, revise), ApplicationRecords (PDFs, stages, deletion)
src/infrastructure/  Postgres (Drizzle), Better Auth, Gemini adapter, Typst renderer
src/prompts/         prompts for extraction, fit analysis, questions and the resume
src/components/ui/   Button, Card, Badge, EmptyState, Field, PageHeader, ...
src/app/             pages, server actions, and the auth, health and PDF routes
```

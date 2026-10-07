# Tailor

<p align="center">
  <img src="./public/brand/tailor-horizontal.svg" alt="Tailor" width="320">
</p>

Paste a job description, answer a few questions, and download a one-page resume tailored to that job. Tailor also tracks where each application stands, from "Not applied" to "Offer".

- **Bring your own key, and it never reaches the server.** Each person adds their own Gemini API key in Settings. It stays in their browser, which calls Google's Gemini API directly; the server only receives the results.
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
- [License](#license)

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
| `TYPST_BIN` | no | Path to the Typst binary. Default `typst`; already in the Docker image. |
| `GEMINI_API_KEY` | no | Your own Gemini key, used only to parse public Hacker News "Who is hiring?" posts for the HN Jobs page (Gemini 2.5 Flash-Lite, about $0.02 a month, usually within the free tier). Without it, posts still show, just without company, role and tags. Users' keys are unrelated and never reach the server. |
| `HN_HIRING_THREAD_ID` | no | Pins the HN thread to show, e.g. `49922569`. Leave empty to follow the latest "Who is hiring?" thread automatically every month. |
| `HN_GEMINI_MODEL` | no | Model for parsing HN posts. Default `gemini-2.5-flash-lite`, the cheapest. |

Users' Gemini keys don't go here (the optional `GEMINI_API_KEY` above is yours, for HN posts only). Users add their own in the app, and the server never receives it. The default models (`gemini-flash-lite-latest` for analysis, `gemini-flash-latest` for writing) are set in `src/infrastructure/llm/geminiLlm.ts`. Each person can pick other models in Settings, from the list Google returns for their key; the choice is kept in their browser.

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
   - **Use a prebuilt image (recommended):** New resource > **Docker Image** > `668461485330.dkr.ecr.ap-southeast-3.amazonaws.com/tailor:latest`. See [Prebuilt images](#prebuilt-images-with-github-actions).
3. Port **3000**. The image's `HEALTHCHECK` (`/api/health`) is picked up automatically.
4. Set the environment variables from step 2, with `DATABASE_URL` set to the Postgres URL from step 1.
5. Set your domain, make sure the Google redirect URI matches it, and deploy.

### Option C: Any container host

Fly.io, Railway, Render, Kubernetes and similar all work: run the image, set the environment variables, point `DATABASE_URL` at a Postgres database, expose port 3000, and use `/api/health` as the health check. Run one instance; the PDF cleanup job runs inside the app process.

### Prebuilt images with GitHub Actions

`.github/workflows/tailor-image.yml` runs when you start it: **Actions > Tailor image > Run workflow** (pick the branch, usually `main`). It runs the CI checks, then builds and pushes `668461485330.dkr.ecr.ap-southeast-3.amazonaws.com/tailor:latest` and a `sha-xxxxxxx` tag to Amazon ECR. Building there means a small server never has to build. To use another registry, change `AWS_REGION` and `IMAGE` at the top of the workflow.

**One-time AWS setup (lets GitHub push without stored AWS keys):**

1. IAM > Identity providers > Add provider: OpenID Connect, URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Create a role with this trust policy, so only this repository's `main` branch can use it:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Federated": "arn:aws:iam::668461485330:oidc-provider/token.actions.githubusercontent.com" },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": {
           "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
           "token.actions.githubusercontent.com:sub": "repo:mhdiiilham/tailor:ref:refs/heads/main"
         }
       }
     }]
   }
   ```
3. Give the role permission to push to the one repository:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
       {
         "Effect": "Allow",
         "Action": [
           "ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:InitiateLayerUpload",
           "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage"
         ],
         "Resource": "arn:aws:ecr:ap-southeast-3:668461485330:repository/tailor"
       }
     ]
   }
   ```
4. Add the role's ARN as the repository secret `AWS_ROLE_ARN`.
5. The workflow pushes `latest` every time, so the ECR repository's tag immutability must be **off** (Mutable).

**Let the server pull from ECR.** An ECR login only lasts 12 hours, so a one-off `docker login` stops working. Use Amazon's credential helper on the server instead, which signs in on every pull:

1. Create an IAM user with only `ecr:GetAuthorizationToken`, `ecr:BatchGetImage` and `ecr:GetDownloadUrlForLayer` (the last two on the `tailor` repository), and an access key for it.
2. On the server, as the user Coolify runs Docker with (usually `root`):
   ```sh
   sudo apt-get install -y amazon-ecr-credential-helper
   mkdir -p ~/.aws ~/.docker
   printf '[default]\naws_access_key_id=<key id>\naws_secret_access_key=<secret>\nregion=ap-southeast-3\n' > ~/.aws/credentials
   chmod 600 ~/.aws/credentials
   echo '{ "credHelpers": { "668461485330.dkr.ecr.ap-southeast-3.amazonaws.com": "ecr-login" } }' > ~/.docker/config.json
   docker pull 668461485330.dkr.ecr.ap-southeast-3.amazonaws.com/tailor:latest   # should work with no login
   ```
   If `~/.docker/config.json` already exists, add the `credHelpers` entry to it instead of overwriting it.

**Optional:** deploy to Coolify after each image build by adding repository secrets `COOLIFY_WEBHOOK` (the resource's deploy webhook URL) and `COOLIFY_TOKEN` (a Coolify API token).

The image is built for `linux/amd64`. For an ARM server, add `linux/arm64` to `platforms` in the workflow.

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
- **Logs:** the PDF cleanup logs `[retention] ...`. Gemini calls happen in the browser, so they never appear in server logs (the browser console shows model, tokens and duration at the debug level).
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

### Continuous integration

`.github/workflows/ci.yml` runs on every pull request and every push, including `main`: typecheck (it generates Next.js route types first), lint, tests (with Typst installed, so PDF rendering is tested for real), a check that migrations match the schema, and a production build. The image workflow runs the same checks before it builds.

## How it works

1. **Paste a job description.** A quick check in the browser shows which tech it mentions is or isn't in your profile.
2. **Fit analysis.** Gemini extracts the requirements and matches each against your profile. The score is computed in code from those matches (40% requirements, 25% stack, 20% seniority, 10% nice-to-haves, 5% domain).
3. **Questions.** Two fixed questions, plus two to four about your gaps.
4. **Resume.** Gemini returns structured JSON that points at your roles and projects by index. `src/infrastructure/typst/typstResume.ts` turns it into Typst and compiles a PDF, so titles, companies and dates always come from your profile. Banned buzzwords trigger one rewrite, and em dashes are removed.
5. **Cover letter (optional).** Gemini drafts three or four paragraphs from the resume, your answers and your voice sample, a second pass rewrites it to remove AI-sounding patterns, and a final check catches leftover clichés. It's stored and shown as plain text to copy.
6. **Track it.** Set the stage (Not applied, Applied, Technical assessment, Interviewing, Offer, Rejected, Withdrawn); the applied date is recorded automatically.

**Where it runs:** every Gemini call (steps 2 to 5) runs in the browser with the user's key, using the workflows in `src/application/workflows.ts`. Only the results go to the server, which validates them again (schemas, the fit score recomputed, roles checked against the stored profile), builds the Typst source itself and saves. The Content Security Policy only lets the page connect to the app and `generativelanguage.googleapis.com`.

**What's stored:** per user, the profile, and per application the job description, answers, analysis, resume content, Typst source, cover letter (if generated) and stage. PDFs are deleted 24 hours after they're made and rebuilt from the Typst source if downloaded later. People can delete an application or their whole account at any time.

```
src/domain/          entities, schemas, fit scoring, stages, retention, allowlist (no framework code)
src/application/     workflows (the AI steps, run in the browser), ApplicationService (validate and save), ApplicationRecords (PDFs, stages, deletion)
src/infrastructure/  Postgres (Drizzle), Better Auth, Gemini adapter, Typst renderer
src/prompts/         prompts for extraction, fit analysis, questions and the resume
src/components/ui/   Button, Card, Badge, EmptyState, Field, PageHeader, ...
src/app/             pages, server actions, and the auth, health and PDF routes
```

## License

Copyright (C) 2026 Muhammad Ilham. Licensed under the [GNU Affero General Public License v3.0](LICENSE).

You can use, change and host Tailor. If you run a modified version for other people, the AGPL asks you to offer them its source code too. Point `SOURCE_URL` in `src/app/seo/site.ts` at your fork; it's linked in the footer of every page and on the landing page.

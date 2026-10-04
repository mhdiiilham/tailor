# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies (better-sqlite3 compiles a native module).
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Peaks around 1.4 GB of RAM: build on a server with at least 2 GB plus swap.
RUN npm run build

# Typst, pinned to the version the renderer is tested with, plus a warm package
# cache so building a PDF never needs to reach packages.typst.org at runtime.
FROM base AS typst
ARG TYPST_VERSION=0.15.1
ARG TARGETARCH
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates xz-utils \
  && rm -rf /var/lib/apt/lists/*
RUN case "$TARGETARCH" in \
      arm64) arch=aarch64 ;; \
      *) arch=x86_64 ;; \
    esac \
  && curl -fsSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${arch}-unknown-linux-musl.tar.xz" \
     | tar -xJ -C /tmp \
  && mv /tmp/typst-*/typst /usr/local/bin/typst
ENV TYPST_PACKAGE_CACHE_PATH=/opt/typst/packages
RUN printf '#import "@preview/basic-resume:0.2.9": *\nok\n' > /tmp/warm.typ \
  && typst compile /tmp/warm.typ /tmp/warm.pdf

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=/data/career.db \
    TYPST_PACKAGE_CACHE_PATH=/opt/typst/packages

COPY --from=typst /usr/local/bin/typst /usr/local/bin/typst
COPY --from=typst /opt/typst /opt/typst
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/drizzle ./drizzle

# Mount a persistent volume here. It holds the SQLite database (migrations run on start).
RUN mkdir -p /data && chown node:node /data
VOLUME /data

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]

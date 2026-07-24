# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# MernCrest production image (Next.js 14 standalone + Prisma)
# Debian slim base; openssl required by the Prisma query engine.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: full dependency install (dev deps needed for build + migrate) ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# Prefer the reproducible lockfile install; fall back to npm install when the
# lockfile is out of sync so a stale lock never blocks a deploy.
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# ---- builder: produce the Next.js standalone output ----
FROM base AS builder
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A placeholder DATABASE_URL so the build never opens a real connection.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- migrator: one-off container that syncs schema + seeds (see compose) ----
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
# seed.ts imports static data from lib/data/* (blogs, knowledge-base, etc.)
COPY lib ./lib
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts"]

# ---- runner: minimal runtime image ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# Standalone server + assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Ensure the generated Prisma engine is present in the standalone node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

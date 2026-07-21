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
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: produce the Next.js standalone output ----
FROM base AS builder
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
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts"]

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

# syntax=docker/dockerfile:1

# FINDEN ISMS — multi-stage production image (Next.js standalone)
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Dummy URLs so prisma generate / postinstall never need a live DB
ENV DATABASE_URL="postgresql://isms:isms@127.0.0.1:5432/isms"
ENV DIRECT_URL="postgresql://isms:isms@127.0.0.1:5432/isms"
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://isms:isms@127.0.0.1:5432/isms"
ENV DIRECT_URL="postgresql://isms:isms@127.0.0.1:5432/isms"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
RUN pnpm exec prisma generate
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV STORAGE_ROOT=/app/data/uploads

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/data/uploads \
  && chown -R nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Full node_modules so `prisma migrate deploy` works with pnpm's .pnpm store layout
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/deploy/entrypoint.sh ./deploy/entrypoint.sh

RUN chmod +x /app/deploy/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/deploy/entrypoint.sh"]
CMD ["node", "server.js"]

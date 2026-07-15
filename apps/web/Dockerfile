# ---------- Frontend (Next.js) Dockerfile — فاز ۰ ----------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --filter @cement/web... --no-frozen-lockfile

COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

RUN pnpm --filter @cement/shared-types build

WORKDIR /app/apps/web
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]

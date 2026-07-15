# ---------- Backend (NestJS) Dockerfile — فاز ۰ (development-oriented) ----------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
WORKDIR /app

# نصب وابستگی‌ها با در نظر گرفتن ساختار Monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @cement/api... --no-frozen-lockfile

# کپی سورس
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# shared-types باید قبل از api ساخته شود (dist/index.js در Runtime لازم است)
RUN pnpm --filter @cement/shared-types build

WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3001
# Migration در استارت اجرا و سپس سرور بالا می‌آید
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]

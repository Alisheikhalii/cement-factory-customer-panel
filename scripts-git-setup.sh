#!/bin/sh
# One-shot git init + logical per-phase commits + push.
# Run from C:/Users/HP/Desktop/cement
set -e
cd "C:/Users/HP/Desktop/cement"

git init -b main
git remote add origin https://github.com/Alisheikhalii/cement-factory-customer-panel.git || git remote set-url origin https://github.com/Alisheikhalii/cement-factory-customer-panel.git

# ---- Commit 1: project foundation (everything up to end of Phase 5.5) ----
git add .gitignore package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json docker-compose.yml README.md docs packages apps/web
git add package-lock.json 2>/dev/null || true
# api: everything except phase 6/7 specific files (added below); simplest: add all api src now minus the new modules, but to keep history useful we stage the base app wholesale.
git add apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json apps/api/jest.config.json apps/api/.env.example 2>/dev/null || true
git add apps/api/prisma apps/api/src
# unstage phase-specific paths so they land in their own commits
git reset -q apps/api/src/modules/erp-integration
git reset -q apps/api/src/common/throttling
git reset -q apps/api/src/common/services/file-storage.service.ts apps/api/src/common/services/file-storage.service.spec.ts
git reset -q apps/api/src/common/services/mailer.service.ts apps/api/src/common/services/mailer.service.spec.ts
git reset -q apps/api/src/common/observability
git reset -q apps/api/loadtest 2>/dev/null || true
# 7e coverage specs get their own commit
git reset -q \
  apps/api/src/common/utils/decimal.util.spec.ts \
  apps/api/src/common/utils/role.util.spec.ts \
  apps/api/src/common/utils/customer-scope.util.spec.ts \
  apps/api/src/common/dto/pagination.dto.spec.ts \
  apps/api/src/common/filters/global-exception.filter.spec.ts \
  apps/api/src/common/interceptors/transform.interceptor.spec.ts \
  apps/api/src/modules/surveys/survey.state-machine.spec.ts \
  apps/api/src/modules/surveys/surveys.mapper.spec.ts \
  apps/api/src/modules/orders/orders.mapper.spec.ts \
  apps/api/src/modules/finance/finance.mapper.spec.ts \
  apps/api/src/modules/finance/finance.service.spec.ts \
  apps/api/src/modules/complaints/complaints.mapper.spec.ts \
  apps/api/src/modules/loading-requests/loading-requests.mapper.spec.ts \
  apps/api/src/modules/auth/services/otp.service.spec.ts \
  apps/api/src/modules/auth/services/login-throttle.service.spec.ts \
  apps/api/src/modules/notifications/notification.service.spec.ts 2>/dev/null || true
git commit -m "feat: cement customer portal monorepo (phases 0-5.5)

NestJS API (auth/OTP, orders, deliveries, finance, complaints,
surveys, loading requests, notifications, admin panel), Next.js
web app, shared-types package, Prisma schema + seed, Docker
compose for postgres/redis."

# ---- Commit 2: Phase 6 ERP adapters ----
git add apps/api/src/modules/erp-integration
git commit -m "feat(erp): mock/sql-server/rest-api/file-based ERP adapters

Port/adapter pattern behind ERP_ADAPTER_TOKEN; adapter selected via
ERP_ADAPTER env var. All connection settings env-driven so switching
to the factory's real ERP requires only .env changes. Injectable
sql/http ports for testing; full spec coverage against mock data."

# ---- Commit 3: 7a Redis throttling ----
git add apps/api/src/common/throttling
git commit -m "feat(throttling): Redis-backed rate limiting

RedisThrottlerStorage with atomic Lua eval via injectable
RedisEvalClient; write-throttle decorator for mutating endpoints."

# ---- Commit 4: 7b file storage ----
git add apps/api/src/common/services/file-storage.service.ts apps/api/src/common/services/file-storage.service.spec.ts
git commit -m "feat(storage): local-disk file storage for receipt uploads

Env-driven root dir (FILE_STORAGE_DIR), storage:// URL scheme,
path-traversal-safe resolvePath with strict root containment."

# ---- Commit 5: 7c SMTP ----
git add apps/api/src/common/services/mailer.service.ts apps/api/src/common/services/mailer.service.spec.ts
git commit -m "feat(mail): real SMTP delivery via nodemailer

Lazy-loaded transport behind injectable MAIL_TRANSPORT_FACTORY;
falls back to console logging in dev when SMTP env is absent."

# ---- Commit 6: 7d Sentry + security headers ----
git add apps/api/src/common/observability
git commit -m "feat(observability): Sentry error tracking + security hardening

initSentry() bootstrapped first in main.ts; helmet CSP and
production-only HSTS already wired in bootstrap."

# ---- Commit 7: 7e load test ----
git add apps/api/loadtest
git commit -m "test(loadtest): basic HTTP load test script for the API"

# ---- Commit 8: 7e coverage specs ----
git add "apps/api/src/**/*.spec.ts" 2>/dev/null || git add apps/api/src
git diff --cached --quiet || git commit -m "test: unit coverage for utils, mappers, filters, and services

Adds specs for decimal/role/customer-scope utils, pagination DTO,
global exception filter, transform interceptor, survey state
machine, module mappers (orders/finance/surveys/complaints/
loading-requests), finance createReceipt (BR-16), OTP, login
throttle, and notification services. Suite: 37 suites / 201 tests."

# ---- Commit 9: anything remaining (safety net) ----
git add -A
git diff --cached --quiet || git commit -m "chore: remaining project files"

git push -u origin main
echo "===DONE==="
git log --oneline

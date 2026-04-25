# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nuxt 4 template app with Better Auth (email OTP authentication), Prisma ORM, SQLite, and Nuxt UI v3. Uses pnpm as the package manager.

## Common Commands

- **Dev server** (also starts Prisma Studio): `pnpm dev`
- **Build**: `pnpm build`
- **Reset DB** (migrate, generate client, seed): `pnpm prisma:reset`
- **Generate Prisma client only**: `pnpm prisma generate`
- **Run migrations**: `pnpm prisma migrate dev`
- **Format**: `npx prettier --write .`

## Architecture

### Frontend (`app/`)

- **Nuxt 4** with `compatibilityDate: 2025-07-15` and future compat flags via the `app/` directory structure
- **UI**: Nuxt UI v3 components (`UButton`, `UCard`, `UModal`, etc.) with Tailwind CSS
- **Auth client**: `app/utils/auth-client.ts` — Better Auth Vue client with emailOTP plugin
- **Global auth middleware**: `app/middleware/auth.global.ts` — redirects unauthenticated users to `/auth`, authenticated users away from `/auth`
- **Pages**: `/auth` (email OTP login flow) and `/` (dashboard with user list + profile picture upload)

### Backend (`server/`)

- **Auth handler**: `server/api/auth/[...all].ts` — catch-all route delegating to Better Auth
- **Auth config**: `server/utils/auth.ts` — Better Auth setup with Prisma adapter (SQLite) and emailOTP plugin using Nodemailer (Gmail SMTP)
- **Prisma client**: `server/utils/prisma.ts` — uses `@prisma/adapter-better-sqlite3` driver adapter
- **API routes**: `server/api/users/` — user listing, profile image serving, and file upload (multipart form)

### Database (`prisma/`)

- **SQLite** via `better-sqlite3` driver adapter (not the default Prisma SQLite driver)
- **Prisma client output**: `prisma/generated/` (custom output path)
- **Schema models**: User, Session, Account, Verification (Better Auth tables)
- **Seed**: `prisma/seed.ts` run via `tsx`
- **Config**: `prisma.config.ts` at project root

### Deployment

- Docker multi-stage build (Node 22 Alpine, ARM64)
- `entrypoint.sh` runs `prisma generate` + `prisma migrate deploy` before starting the server
- GitHub Actions CI pushes to AWS ECR on main branch

## Testing

- **Run all tests**: `pnpm test`
- **Run tests in watch mode**: `pnpm test:watch`
- **Run unit tests only**: `pnpm test:unit`
- **Run API tests only**: `pnpm test:api`
- **Run E2E tests**: `pnpm test:e2e`
- **Type check**: `pnpm typecheck`
- **Lint**: `pnpm lint`
- **Lint + fix**: `pnpm lint:fix`

### Test conventions

- Unit tests for server utilities are co-located: `server/utils/foo.test.ts`
- API integration tests go in `tests/api/`
- E2E tests go in `tests/e2e/`
- Every new utility function should have unit tests
- Every new API endpoint should have API tests covering: happy path, error cases, role enforcement

### Git hooks

- **Pre-commit**: lint-staged (ESLint fix + Prettier on staged files)
- **Pre-push**: typecheck + test suite

## Code Style

- Prettier: no semicolons, single quotes, 2-space indent, trailing commas (es5), 100 char width
- Vue files use `vueIndentScriptAndStyle: true` (script/template content indented one level)
- Tailwind CSS class sorting via `prettier-plugin-tailwindcss`

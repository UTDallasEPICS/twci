# Contributing Workflow

Step-by-step process for working on any issue in this repo.

## Branch Strategy

This repo has two long-lived branches and short-lived feature branches:

```
feature branches → stage → main
```

| Branch | Purpose | Deployed to |
|---|---|---|
| `main` | Production — what the client uses | Production environment |
| `stage` | Staging — internal testing of deployed version | Staging environment |
| `<issue>-<name>` | Feature work — one per issue | Local / PR only |

**Flow:**
1. Feature branches are created off `stage`
2. PRs target `stage`
3. Changes are tested on the staging deployment
4. Once verified, `stage` is promoted to `main` (merge or PR from `stage` → `main`)

**Rules:**
- Never push directly to `main` or `stage`
- All changes go through PRs
- `main` should only ever receive merges from `stage`

## Before You Start

- Make sure the testing infrastructure is set up (#13)
- Make sure all blocking issues for your issue are merged to `stage`
- Pull latest `stage`: `git checkout stage && git pull`

## Step 1: Pick an Issue

- Check the [issues board](https://github.com/UTDallasEPICS/twci/issues) for the next unassigned issue
- Respect the dependency chain — don't start an issue if its blockers aren't merged
- Assign yourself to the issue

## Step 2: Read and Understand

- Read the full issue description, acceptance criteria, and linked docs
- Read every file that will be touched or is related to the change
- Identify what existing code might break
- Note any open questions or decisions the issue leaves ambiguous — ask before assuming

## Step 3: Branch

Create a branch off `stage` and link it to the issue:

```bash
git checkout stage && git pull
gh issue develop <issue-number> --checkout --name <issue-number>-<short-description> --base stage
```

Example:
```bash
git checkout stage && git pull
gh issue develop 1 --checkout --name 1-schema-update --base stage
```

This creates the branch off `stage`, checks it out, and links it to the issue on GitHub.

## Step 4: Implement

Work through the issue's scope section by section.

### Commit often, commit small

Each commit should be one logical chunk of work. Examples of good commit boundaries:

- Add/update Prisma schema
- Add a new API route
- Add a new page or component
- Add tests for a feature
- Fix lint/type errors

Do NOT save everything for one giant commit at the end.

### Include tests with your code

Every PR must include tests appropriate to the change:

| What you're adding | Tests to include |
|---|---|
| Utility function | Unit tests (co-located `*.test.ts`) |
| API route | API integration tests (`tests/api/`) |
| New page/component | Manual visual check (document in PR) |
| Schema change | Verify migration runs cleanly |
| Business logic | Unit tests for all branches/edge cases |

### Keep docs in sync

If your implementation deviates from what's in `docs/`, update the relevant doc in the same PR. Also update `CLAUDE.md` if you add new commands, change architecture, or modify the project structure.

## Step 5: Verify

Before pushing, run through this checklist:

```bash
# 1. Lint (auto-fixed on commit via hooks, but check manually too)
pnpm lint

# 2. Type check
pnpm typecheck

# 3. Run tests
pnpm test

# 4. Build (make sure nothing's broken)
pnpm build
```

The pre-push hook runs typecheck + tests automatically, but catching issues early saves time.

### Manual checks

- Start the dev server (`pnpm dev`) and manually verify the acceptance criteria from the issue
- Check for regressions — does existing functionality still work?
- Test role-based access if applicable (try as admin, supervisor, employee)

## Step 6: Push and Create PR

```bash
git push -u origin <branch-name>
```

Create a PR **targeting `stage`** and referencing the issue:

```bash
gh pr create --base stage --title "Short description" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what this PR does>

## Changes
<List of notable changes, organized by area (schema, API, UI, etc.)>

## Test plan
- [ ] <Acceptance criteria from the issue, as checkboxes>
- [ ] Lint passes
- [ ] Type check passes
- [ ] Unit/API tests pass
- [ ] Manual verification (describe what you checked)

## Docs updated
- [ ] List any docs that were added/modified, or "N/A"

Closes #<issue-number>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Step 7: Review

- **Never merge your own PR.** All PRs are reviewed by Tushar before merging.
- If the reviewer requests changes, make them on the same branch and push — the PR updates automatically.
- Once approved, the reviewer merges.

## Step 8: Clean Up

After the PR is merged to `stage`:

```bash
git checkout stage
git pull
git branch -d <branch-name>
```

Move on to the next issue.

## Promoting Stage to Main

When a set of changes on `stage` has been tested and verified on the staging deployment:

1. Create a PR from `stage` → `main`
2. PR title: "Release: <summary of what's included>"
3. PR body: list the issues/PRs included in this promotion
4. Tushar reviews and merges

This is how changes reach production. Never merge feature branches directly to `main`.

## Quick Reference

### Branch naming
`<issue-number>-<short-description>` — e.g., `13-testing-infra`, `1-schema-update`

### Commit message style
Concise, imperative mood. What the commit does, not what you did.
- "Add Location and Item models to Prisma schema"
- "Add GET /api/locations endpoint with role check"
- "Add unit tests for email domain validation"

### PR title style
Short (under 70 chars), matches the issue title or summarizes the change.

### Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server + Prisma Studio |
| `pnpm build` | Production build |
| `pnpm test` | Run all Vitest tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:unit` | Run unit tests only |
| `pnpm test:api` | Run API tests only |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm prisma:reset` | Reset DB, migrate, generate, seed |
| `pnpm prisma generate` | Regenerate Prisma client |
| `pnpm prisma migrate dev` | Run migrations |

# Seed Data

## Overview

The seed script (`prisma/seed.ts`) populates the database with locations, users, items, and checkout logs. This runs as part of `pnpm prisma:reset`.

## Locations

Three locations are seeded:

```typescript
const locations = [
  {
    name: 'The Warren Center - Central',
    address: '320 Custer Rd, Richardson, TX 75080',
  },
  {
    name: 'The Warren Center - East',
    address: '2625 Anita Dr, Garland, TX 75041',
  },
  {
    name: 'The Warren Center - West',
    address: '400 E Royal Ln Suite 112, Irving, TX 75039',
  },
]
```

## Users

### Source

`prisma/seed/users.json` — a JSON fixture with 102 entries (100 converted from the HR roster CSV export, plus 2 extra accounts below). The seed script does no parsing; each entry already carries its final fields:

| Fixture Field        | Notes                                           |
| -------------------- | ----------------------------------------------- |
| `legalFirstName`     | From roster "Legal Name" (split on first comma) |
| `legalLastName`      | From roster "Legal Name" (split on first comma) |
| `preferredFirstName` | Nullable                                        |
| `preferredLastName`  | Nullable                                        |
| `email`              | Lowercased; authoritative for login             |
| `role`               | Baked in: `admin`, `supervisor`, or `employee`  |
| `status`             | Baked in: `active` or `on_leave`                |

To change who gets seeded, edit `users.json` directly. `prisma/seed.test.ts` validates the fixture (unique emails, known roles/statuses, non-empty names).

The original CSV quirks (quoted commas in job titles, multi-word last names, emails that don't match legal names) were resolved once during the CSV → JSON conversion and no longer concern the seed script.

### Display Name Computation

Better Auth's `name` field is set to the display name:

```typescript
const displayFirst = preferredFirstName || legalFirstName
const displayLast = preferredLastName || legalLastName
const name = `${displayFirst} ${displayLast}`
```

### Role Assignments

| Email                                | Role         |
| ------------------------------------ | ------------ |
| `brandy.lindsey@thewarrencenter.org` | `admin`      |
| `isabel.saenz@thewarrencenter.org`   | `admin`      |
| `reachtusharwani@gmail.com`          | `admin`      |
| `tmw220003@utdallas.edu`             | `supervisor` |
| All other roster emails              | `employee`   |

Tushar Wani (`reachtusharwani@gmail.com`) is not in the roster and lives in `users.json`:

```json
{
  "legalFirstName": "Tushar",
  "legalLastName": "Wani",
  "email": "reachtusharwani@gmail.com",
  "role": "admin",
  "status": "active"
}
```

The supervisor seed user (`tmw220003@utdallas.edu`):

```json
{
  "legalFirstName": "Tushar",
  "legalLastName": "Wani",
  "email": "tmw220003@utdallas.edu",
  "role": "supervisor",
  "status": "active"
}
```

### Status Mapping

Applied once during the CSV → JSON conversion (the CSV's `Position Status` column no longer exists):

| Roster Position Status | Fixture `status` |
| ---------------------- | ---------------- |
| `Active`               | `active`         |
| `Leave`                | `on_leave`       |

Currently only Amanda Johnston has `on_leave` status in the fixture.

### Seed Script Behavior

The seed script should:

1. Upsert locations (idempotent by name)
2. Read `prisma/seed/users.json` from inside the `prisma/` directory
3. For each entry, upsert a user by email, refreshing names/role/status on re-run
4. Assign roles from the `role` field baked into each fixture entry
5. Seed items and checkout logs (see below)

## Items

8 sample items are seeded across the three locations:

| Item                 | Location |
| -------------------- | -------- |
| iPad Pro #1          | Central  |
| iPad Pro #2          | East     |
| Therapy Ball - Large | Central  |
| Projector            | West     |
| Laptop Cart          | East     |
| First Aid Kit        | Central  |
| Audio System         | West     |
| Therapy Swing        | East     |

All items start with condition `good` and status `available`. Existing seed items are deleted and re-created on each run (not upserted) to ensure clean state.

## Checkout Logs

8 checkout logs are seeded to populate the dashboard and history views:

**Open checkouts** (4 items currently checked out):

| Item         | Days Out | Purpose               |
| ------------ | -------- | --------------------- |
| iPad Pro #1  | ~3 days  | Green days-out badge  |
| Laptop Cart  | ~5 days  | Green days-out badge  |
| Projector    | ~12 days | Yellow days-out badge |
| Audio System | ~35 days | Red days-out badge    |

**Completed checkouts** (4 returned items):

| Item                    | Notes                                        |
| ----------------------- | -------------------------------------------- |
| iPad Pro #2             | Returned in good condition, moved to Central |
| Therapy Ball - Large    | Returned in fair condition                   |
| Therapy Swing (cycle 1) | Returned in good condition                   |
| Therapy Swing (cycle 2) | Returned in good condition, moved to West    |

Checkout performers alternate between the admin (Brandy Lindsey) and supervisor (Isabel Saenz) seed users. Item holders are drawn from the first 6 active employees. All checkout logs are deleted and re-created on each seed run.

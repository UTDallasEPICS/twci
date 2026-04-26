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

`roster.csv` at the project root. 100 rows with columns:

| CSV Column                     | Maps To                                              |
| ------------------------------ | ---------------------------------------------------- |
| Legal Name                     | Parsed into `legalFirstName` + `legalLastName`       |
| Preferred or Chosen First Name | `preferredFirstName` (nullable)                      |
| Preferred or Chosen Last Name  | `preferredLastName` (nullable)                       |
| Work Contact: Work Email       | `email`                                              |
| Position Status                | `status` (`Active` → `active`, `Leave` → `on_leave`) |
| Job Title Description          | Not stored (informational only, for now)             |

### Parsing Legal Name

The CSV stores legal name as `"LastName, FirstName"`. The seed script must split on the comma:

```typescript
// "Abernathy, Christopher" → legalFirstName: "Christopher", legalLastName: "Abernathy"
// "Hernandez Kilpatrick, Hilda" → legalFirstName: "Hilda", legalLastName: "Hernandez Kilpatrick"
// "Almeyda Noriega, Irma" → legalFirstName: "Irma", legalLastName: "Almeyda Noriega"
const [lastName, firstName] = legalName.split(',').map((s) => s.trim())
```

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

Tushar Wani (`reachtusharwani@gmail.com`) is not in the roster CSV and must be added manually in the seed:

```typescript
{
  legalFirstName: 'Tushar',
  legalLastName: 'Wani',
  email: 'reachtusharwani@gmail.com',
  role: 'admin',
  status: 'active',
}
```

The supervisor seed user (`tmw220003@utdallas.edu`):

```typescript
{
  legalFirstName: 'Tushar',
  legalLastName: 'Wani',
  email: 'tmw220003@utdallas.edu',
  role: 'supervisor',
  status: 'active',
}
```

### Status Mapping

| CSV Position Status | User Status |
| ------------------- | ----------- |
| `Active`            | `active`    |
| `Leave`             | `on_leave`  |

Currently only Amanda Johnston has `Leave` status in the roster.

### Seed Script Behavior

The seed script should:

1. Upsert locations (idempotent by name)
2. Parse `roster.csv` using a CSV parser
3. For each row, create a user with mapped fields
4. Add the two extra users (Tushar admin + Tushar supervisor)
5. Assign roles based on the role mapping table above
6. Use upsert on email to make the seed idempotent (safe to re-run)

### CSV Edge Cases

Some roster entries have quirks the parser must handle:

- **Quoted fields with commas**: Job titles like `"Medical Billing Associate, Credentialing"` — standard CSV parsing handles this
- **Empty preferred name fields**: Most rows have empty preferred names — these become `null`
- **Email doesn't match name**: Some emails use maiden/preferred names (e.g., `Bobo, Ashlyn` has email `ashlyn.smith@thewarrencenter.org`). The email is authoritative for login; names are for display.
- **Multi-word last names**: `"Hernandez Kilpatrick, Hilda"`, `"Wilson Martin, Laquasha"` — split only on the first comma

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

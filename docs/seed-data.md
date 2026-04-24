# Seed Data

## Overview

The seed script (`prisma/seed.ts`) populates the database with locations and users from the employee roster. This runs as part of `pnpm prisma:reset`.

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

| CSV Column | Maps To |
|---|---|
| Legal Name | Parsed into `legalFirstName` + `legalLastName` |
| Preferred or Chosen First Name | `preferredFirstName` (nullable) |
| Preferred or Chosen Last Name | `preferredLastName` (nullable) |
| Work Contact: Work Email | `email` |
| Position Status | `status` (`Active` → `active`, `Leave` → `on_leave`) |
| Job Title Description | Not stored (informational only, for now) |

### Parsing Legal Name

The CSV stores legal name as `"LastName, FirstName"`. The seed script must split on the comma:

```typescript
// "Abernathy, Christopher" → legalFirstName: "Christopher", legalLastName: "Abernathy"
// "Hernandez Kilpatrick, Hilda" → legalFirstName: "Hilda", legalLastName: "Hernandez Kilpatrick"
// "Almeyda Noriega, Irma" → legalFirstName: "Irma", legalLastName: "Almeyda Noriega"
const [lastName, firstName] = legalName.split(',').map(s => s.trim())
```

### Display Name Computation

Better Auth's `name` field is set to the display name:

```typescript
const displayFirst = preferredFirstName || legalFirstName
const displayLast = preferredLastName || legalLastName
const name = `${displayFirst} ${displayLast}`
```

### Role Assignments

| Email | Role |
|---|---|
| `brandy.lindsey@thewarrencenter.org` | `admin` |
| `isabel.saenz@thewarrencenter.org` | `admin` |
| `reachtusharwani@gmail.com` | `admin` |
| `tmw220003@utdallas.edu` | `supervisor` |
| All other roster emails | `employee` |

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
|---|---|
| `Active` | `active` |
| `Leave` | `on_leave` |

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

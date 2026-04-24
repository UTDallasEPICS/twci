# Data Model

## Overview

The schema extends Better Auth's default tables (User, Session, Account, Verification) and adds inventory-specific models (Location, Item, CheckoutLog). All models use UUID primary keys and SQLite as the database via Prisma with the `better-sqlite3` driver adapter.

## Entity Relationship Diagram

```
Location 1──* Item (homeLocationId)
Location 1──* Item (currentLocationId)
Location 1──* CheckoutLog (checkedOutFromLocationId)
Location 1──* CheckoutLog (checkedInAtLocationId)

User 1──* CheckoutLog (userId — who has/had the item)
User 1──* CheckoutLog (checkedOutBy — admin/supervisor who performed checkout)
User 1──* CheckoutLog (checkedInBy — admin/supervisor who performed check-in)

Item 1──* CheckoutLog
```

## Models

### Location

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| name | String | e.g., "The Warren Center - Central" |
| address | String? | Optional full address |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

### User (extends Better Auth)

Better Auth provides: `id`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`, `name`.

Additional fields:

| Field | Type | Notes |
|---|---|---|
| legalFirstName | String | Required |
| legalLastName | String | Required |
| preferredFirstName | String? | Optional, displayed when present |
| preferredLastName | String? | Optional, displayed when present |
| role | String | `admin`, `supervisor`, or `employee` |
| status | String | `active`, `on_leave`, or `inactive` |

The existing `name` field from Better Auth can be computed as the display name (preferred name if set, otherwise legal name).

**Display name logic:**
- First name: `preferredFirstName ?? legalFirstName`
- Last name: `preferredLastName ?? legalLastName`

### Item

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| name | String | Human-readable item name |
| description | String? | Optional details |
| condition | String | `good`, `fair`, `damaged`, or `retired` |
| status | String | `available` or `checked_out` |
| homeLocationId | String (FK) | Location where item was originally assigned |
| currentLocationId | String (FK) | Location where item currently resides (updates on check-in) |
| qrCodeUrl | String | Stored path/data for the generated QR code |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

### CheckoutLog

The audit trail. Each checkout creates a row. Check-in completes that row.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| itemId | String (FK) | The item being checked in/out |
| userId | String (FK) | The person who has/had the item |
| checkedOutBy | String (FK → User) | Admin/supervisor who performed checkout |
| checkedOutFromLocationId | String (FK → Location) | Where the item was when checked out |
| checkedOutAt | DateTime | When checkout occurred |
| checkedInBy | String? (FK → User) | Admin/supervisor who performed check-in (null until returned) |
| checkedInAtLocationId | String? (FK → Location) | Where the item was returned (null until returned) |
| checkedInAt | DateTime? | When check-in occurred (null until returned) |
| conditionOnReturn | String? | `good`, `fair`, `damaged`, or `retired` (null until returned) |
| createdAt | DateTime | Auto-set |

### Session, Account, Verification

These are Better Auth's default models — unchanged from the existing schema. See `prisma/schema.prisma` for current definitions.

## Enums (stored as strings)

| Enum | Values |
|---|---|
| Role | `admin`, `supervisor`, `employee` |
| UserStatus | `active`, `on_leave`, `inactive` |
| ItemCondition | `good`, `fair`, `damaged`, `retired` |
| ItemStatus | `available`, `checked_out` |

All enum transitions are allowed (e.g., an item can go from `retired` back to `good`, a user can move between any status).

## Indexes

Recommended indexes beyond primary keys and unique constraints:

- `Item.homeLocationId`
- `Item.currentLocationId`
- `Item.status` (for filtering available items)
- `CheckoutLog.itemId` (item history queries)
- `CheckoutLog.userId` (user history queries)
- `CheckoutLog.checkedInAt` (finding open checkouts where this is null)

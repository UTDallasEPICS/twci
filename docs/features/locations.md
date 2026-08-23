# Locations

## Overview

Locations represent the physical TWC facilities where equipment is stored and used. Items belong to locations, and the check-in/check-out system tracks item movement between locations.

## Data Model

See [data-model.md](../data-model.md) for the full `Location` schema.

Fields:

- **name**: Display name (e.g., "The Warren Center - Central")
- **address**: Optional full street address
- **status**: `active` or `inactive` (default: `active`)

## Permissions

| Action              | Admin | Supervisor | Employee |
| ------------------- | ----- | ---------- | -------- |
| View locations      | Yes   | Yes        | Yes      |
| Create location     | Yes   | No         | No       |
| Edit location       | Yes   | No         | No       |
| Deactivate location | Yes   | No         | No       |

## Seed Locations

Three locations are seeded at setup:

| Name                        | Address                                    |
| --------------------------- | ------------------------------------------ |
| The Warren Center - Central | 320 Custer Rd, Richardson, TX 75080        |
| The Warren Center - East    | 2625 Anita Dr, Garland, TX 75041           |
| The Warren Center - West    | 400 E Royal Ln Suite 112, Irving, TX 75039 |

## Admin CRUD

### Location List Page

**Route**: `/locations`

- Table/list of all locations with name and address
- Admin sees "Add Location" button and edit/deactivate actions per row
- Each location links to its detail page

### Location Detail Page

**Route**: `/locations/[id]`

Displays:

- Location name and address
- Count of items with this as home location
- Count of items currently at this location
- List of items currently at this location (links to item detail)
- Admin: edit/deactivate buttons

### Create / Edit Form

Fields:

- **Name** (required)
- **Address** (optional)

### Deactivate (Soft Delete)

Locations are never hard-deleted. Instead, admins set a location's status to `inactive`:

- Inactive locations are hidden from normal lists and dropdowns (non-admin users cannot see them)
- Admins can view inactive locations via a toggle on the location list page
- Deactivation is blocked if any items have the location as their `currentLocationId` — items must be reassigned first
- Items with an inactive location as `homeLocationId` are allowed (historical reference)
- Admins can reactivate a location by setting its status back to `active`

This mirrors the user model's `active`/`inactive` status pattern.

## API Routes

| Method | Route                 | Description                                       | Role  |
| ------ | --------------------- | ------------------------------------------------- | ----- |
| GET    | `/api/locations`      | List all locations                                | All   |
| GET    | `/api/locations/[id]` | Get location detail with item counts              | All   |
| POST   | `/api/locations`      | Create location                                   | Admin |
| PUT    | `/api/locations/[id]` | Update location (including deactivate/reactivate) | Admin |

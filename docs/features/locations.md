# Locations

## Overview

Locations represent the physical TWC facilities where equipment is stored and used. Items belong to locations, and the check-in/check-out system tracks item movement between locations.

## Data Model

See [data-model.md](../data-model.md) for the full `Location` schema.

Fields:
- **name**: Display name (e.g., "The Warren Center - Central")
- **address**: Optional full street address

## Permissions

| Action | Admin | Supervisor | Employee |
|---|---|---|---|
| View locations | Yes | Yes | Yes |
| Create location | Yes | No | No |
| Edit location | Yes | No | No |
| Delete location | Yes | No | No |

## Seed Locations

Three locations are seeded at setup:

| Name | Address |
|---|---|
| The Warren Center - Central | 320 Custer Rd, Richardson, TX 75080 |
| The Warren Center - East | 2625 Anita Dr, Garland, TX 75041 |
| The Warren Center - West | 400 E Royal Ln Suite 112, Irving, TX 75039 |

## Admin CRUD

### Location List Page

**Route**: `/locations`

- Table/list of all locations with name and address
- Admin sees "Add Location" button and edit/delete actions per row
- Each location links to its detail page

### Location Detail Page

**Route**: `/locations/[id]`

Displays:
- Location name and address
- Count of items with this as home location
- Count of items currently at this location
- List of items currently at this location (links to item detail)
- Admin: edit/delete buttons

### Create / Edit Form

Fields:
- **Name** (required)
- **Address** (optional)

### Delete

Deleting a location requires handling items that reference it:
- If any items have this as their `homeLocationId` or `currentLocationId`, deletion should be blocked with a message indicating the items must be reassigned first.
- Alternatively, implement a soft-delete or require the admin to reassign items before deletion.

## API Routes

| Method | Route | Description | Role |
|---|---|---|---|
| GET | `/api/locations` | List all locations | All |
| GET | `/api/locations/[id]` | Get location detail with item counts | All |
| POST | `/api/locations` | Create location | Admin |
| PUT | `/api/locations/[id]` | Update location | Admin |
| DELETE | `/api/locations/[id]` | Delete location (blocked if items exist) | Admin |

# Items

## Overview

Items are the central entity in the app. Each item represents a single piece of physical equipment tracked individually with a unique QR code. Items belong to a location and have a condition that is updated throughout their lifecycle.

## Data Model

See [data-model.md](../data-model.md) for the full `Item` schema.

Key fields:
- **name**: Human-readable name (e.g., "iPad Pro #3", "Therapy Ball - Large")
- **description**: Optional details
- **condition**: `good` | `fair` | `damaged` | `retired`
- **status**: `available` | `checked_out`
- **homeLocationId**: Where the item was originally assigned
- **currentLocationId**: Where the item currently resides

## Permissions

| Action | Admin | Supervisor | Employee |
|---|---|---|---|
| View items | Yes | Yes | Yes |
| Create item | Yes | No | No |
| Edit item | Yes | No | No |
| Delete item | Yes | No | No |

## Item Creation Flow

1. Admin navigates to item management page
2. Fills in: name, description (optional), condition (defaults to `good`), location (dropdown)
3. Optionally checks "Set as home location" (checked by default)
4. Submits the form
5. Server creates the item record with a UUID
6. Server generates a QR code encoding the URL: `/items/scan?id=<uuid>`
7. QR code is stored (as a generated image path or data URI)
8. Admin is shown the new item detail page with the QR code ready to print

## Item Detail Page

**Route**: `/items/[id]`

Displays:
- Item name, description, condition badge, status badge
- Home location and current location
- QR code (with print button)
- Checkout history (from CheckoutLog)
- If admin: edit/delete buttons
- If admin/supervisor and item is available: "Check Out" button
- If admin/supervisor and item is checked out: "Check In" button with current holder info

**Route**: `/items/scan?id=<uuid>`

This is the QR code landing page. It resolves the item ID and redirects to `/items/[id]`. If the user is not logged in, the auth middleware handles the redirect-after-login flow (see [auth.md](../auth.md)).

## QR Code Generation

### Library

Use the `qrcode` npm package for server-side generation.

### What's Encoded

The full URL to the item's scan page:

```
https://<app-domain>/items/scan?id=<item-uuid>
```

This allows anyone with a phone camera to scan and be taken directly to the item page (after login if needed).

### Storage

QR codes can be generated on-demand from the item ID (the URL is deterministic), so persistent storage is optional. However, for performance, the generated PNG can be cached on disk in the upload storage path.

## QR Code Printing

### Print Sizes

| Size | Dimensions | Use Case |
|---|---|---|
| Small | 1" x 1" (2.54cm) | Small equipment, tools |
| Medium | 2" x 2" (5.08cm) | General purpose, most items |
| Large | 3" x 3" (7.62cm) | Large equipment, high visibility |

### Single Item Print

Each item detail page has a "Print QR Code" button with a size selector. Clicking it opens a print-friendly view containing:
- QR code at selected size
- Item name (below QR code, small text)
- Item ID (short form, below name)

The print view uses `@media print` CSS to hide everything except the label.

### Batch Print

Admin can select multiple items from the item list and click "Print Labels". This generates a print-friendly page laid out as a grid matching standard label sheet dimensions (e.g., Avery 22806 for 2" square labels). Each cell contains one QR label.

The layout uses CSS `@page` and fixed dimensions to align with physical label sheets.

## Condition Tracking

Condition is set at two points:
1. **Item creation** — admin sets initial condition (defaults to `good`)
2. **Check-in** — admin/supervisor must report condition when returning an item

Condition values: `good`, `fair`, `damaged`, `retired`.

All transitions are allowed, including un-retiring an item. Condition history is preserved in the CheckoutLog (`conditionOnReturn` field).

## API Routes

| Method | Route | Description | Role |
|---|---|---|---|
| GET | `/api/items` | List all items (filterable by location, status, condition) | All |
| GET | `/api/items/[id]` | Get item detail | All |
| POST | `/api/items` | Create item | Admin |
| PUT | `/api/items/[id]` | Update item | Admin |
| DELETE | `/api/items/[id]` | Delete item | Admin |
| GET | `/api/items/[id]/qr` | Generate/serve QR code image | All |
| GET | `/api/items/[id]/history` | Get checkout history for item | All |

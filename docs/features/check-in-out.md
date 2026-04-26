# Check-in / Check-out

## Overview

The check-in/check-out system is how equipment moves between locations and people. Only admins and supervisors can perform these actions. Every transaction is recorded in the CheckoutLog for full audit trail.

## Permissions

| Action                    | Admin | Supervisor | Employee |
| ------------------------- | ----- | ---------- | -------- |
| Check out item to someone | Yes   | Yes        | No       |
| Check out item to self    | Yes   | Yes        | No       |
| Check in item             | Yes   | Yes        | No       |
| View own checkout history | Yes   | Yes        | Yes      |
| View all checkout history | Yes   | Yes        | No       |

## Check-out Flow

### Trigger Points

- Item detail page: "Check Out" button (visible to admin/supervisor when item status is `available`)
- QR code scan: scan item → item detail page → "Check Out"

### Steps

1. Admin/supervisor clicks "Check Out" on an available item
2. Form appears with:
   - **Item**: pre-filled, read-only
   - **From location**: pre-filled with item's `currentLocationId`, read-only
   - **Assign to**: user search/dropdown (can select self or any active user)
3. Submit
4. Server:
   - Validates item is `available`
   - Validates performing user is admin or supervisor
   - Creates a `CheckoutLog` row:
     - `itemId` = the item
     - `userId` = the person receiving the item
     - `checkedOutBy` = the admin/supervisor performing the action
     - `checkedOutFromLocationId` = item's current location
     - `checkedOutAt` = now
     - Check-in fields remain null
   - Updates `Item.status` to `checked_out`
5. UI confirms success, item now shows as checked out

## Check-in Flow

### Trigger Points

- Item detail page: "Check In" button (visible to admin/supervisor when item status is `checked_out`)
- QR code scan: scan item → item detail page → "Check In"

### Steps

1. Admin/supervisor clicks "Check In" on a checked-out item
2. Form appears with:
   - **Item**: pre-filled, read-only
   - **Returning for**: pre-filled with the person who had it checked out, read-only
   - **Check-in location**: dropdown of all locations (required — item could be returned at any location)
   - **Condition**: required dropdown — `good`, `fair`, `damaged`, `retired`
3. Submit
4. Server:
   - Validates item is `checked_out`
   - Validates performing user is admin or supervisor
   - Finds the open `CheckoutLog` row (where `checkedInAt` is null) for this item
   - Updates that row:
     - `checkedInBy` = the admin/supervisor performing the action
     - `checkedInAtLocationId` = selected location
     - `checkedInAt` = now
     - `conditionOnReturn` = selected condition
   - Updates `Item.status` to `available`
   - Updates `Item.condition` to the reported condition
   - Updates `Item.currentLocationId` to the check-in location
5. UI confirms success, item now shows as available at new location

## Audit Trail (CheckoutLog)

Every check-out creates a row. Every check-in completes that row. This gives a complete history.

### Queryable Views

**Item history** — "Where has this item been?"

- Query: `CheckoutLog WHERE itemId = X ORDER BY checkedOutAt DESC`
- Shows: each checkout/check-in cycle with who, when, where, condition

**User history** — "What has this person checked out?"

- Query: `CheckoutLog WHERE userId = X ORDER BY checkedOutAt DESC`
- Shows: all items the person has had, when, current status

**Open checkouts** — "What's currently checked out?"

- Query: `CheckoutLog WHERE checkedInAt IS NULL`
- Shows: all items currently with someone
- **Dashboard page**: `/checkouts` (admin/supervisor only) with location filter, days-out badges (green ≤7d, yellow 8–30d, red >30d), and total count

**Location activity** — "What's moved through this location?"

- Query: `CheckoutLog WHERE checkedOutFromLocationId = X OR checkedInAtLocationId = X`

## Edge Cases

- **Item already checked out**: Check-out button is hidden. Server rejects if status is not `available`.
- **Item already available**: Check-in button is hidden. Server rejects if status is not `checked_out`.
- **User on leave**: Items can still be checked in/out for them (they may need to return equipment). UI could show a warning badge.
- **User inactive**: Should not have items checked out to them. If they become inactive while holding items, admin dashboard should flag these items for retrieval.
- **Concurrent operations**: If two supervisors try to check out the same item simultaneously, the second request should fail gracefully with a "this item is no longer available" message.

## API Routes

| Method | Route                      | Description                     | Role                                 |
| ------ | -------------------------- | ------------------------------- | ------------------------------------ |
| POST   | `/api/items/[id]/checkout` | Check out an item               | Admin, Supervisor                    |
| POST   | `/api/items/[id]/checkin`  | Check in an item                | Admin, Supervisor                    |
| GET    | `/api/items/[id]/history`  | Item's checkout history         | All                                  |
| GET    | `/api/users/[id]/history`  | User's checkout history         | Admin, Supervisor (own history: all) |
| GET    | `/api/checkouts/open`      | All currently checked-out items | Admin, Supervisor                    |

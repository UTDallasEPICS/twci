# Users

## Overview

Every TWC employee has a user account. Users are seeded from the employee roster CSV and managed by admins. The user model extends Better Auth's default User with additional fields for names, role, and status.

## Data Model

See [data-model.md](../data-model.md) for the full `User` schema.

### Name Fields

Four name fields are stored:

| Field              | Required | Notes                                               |
| ------------------ | -------- | --------------------------------------------------- |
| legalFirstName     | Yes      | From roster "Legal Name" column (parsed)            |
| legalLastName      | Yes      | From roster "Legal Name" column (parsed)            |
| preferredFirstName | No       | From roster "Preferred or Chosen First Name" column |
| preferredLastName  | No       | From roster "Preferred or Chosen Last Name" column  |

**Display name logic**: Use preferred name when available, fall back to legal name.

- Display first: `preferredFirstName ?? legalFirstName`
- Display last: `preferredLastName ?? legalLastName`

Better Auth's `name` field is set to the computed display name: `"${displayFirst} ${displayLast}"`.

### Roles

| Role         | Description                                 |
| ------------ | ------------------------------------------- |
| `admin`      | Full access. CRUD everything. Check in/out. |
| `supervisor` | Check in/out items. Read all data.          |
| `employee`   | Read-only. Items checked in/out _for_ them. |

### Statuses

| Status     | Can log in? | Description                                             |
| ---------- | ----------- | ------------------------------------------------------- |
| `active`   | Yes         | Normal access                                           |
| `on_leave` | Yes         | Can log in (e.g., to return items). UI shows indicator. |
| `inactive` | No          | Blocked from login. Must be reactivated by admin.       |

All status transitions are allowed (admin can move a user between any status).

## Permissions

| Action             | Admin | Supervisor | Employee         |
| ------------------ | ----- | ---------- | ---------------- |
| View user list     | Yes   | Yes        | No               |
| View user detail   | Yes   | Yes        | Own profile only |
| Create user        | Yes   | No         | No               |
| Edit user          | Yes   | No         | No               |
| Delete user        | Yes   | No         | No               |
| Change user role   | Yes   | No         | No               |
| Change user status | Yes   | No         | No               |

## Admin User Management

### User List Page

**Route**: `/users`

- Table of all users with: display name, email, role badge, status badge
- Filterable by role and status
- Searchable by name or email
- Admin sees "Add User" button and edit actions per row

### User Detail Page

**Route**: `/users/[id]`

Displays:

- Legal name and preferred name (if different)
- Email, role, status
- Profile picture (existing feature)
- Checkout history (items currently held + past checkouts)
- Admin: edit button, role/status controls

### Create User Form

Fields:

- Legal first name (required)
- Legal last name (required)
- Preferred first name (optional)
- Preferred last name (optional)
- Email (required, must pass domain restriction)
- Role (dropdown: admin, supervisor, employee)
- Status (defaults to `active`)

### Edit User Form

Same fields as create. Admin can change role and status. Email changes should be handled carefully (it's the login identifier).

### Delete User

Deleting a user with open checkouts should be blocked — items must be checked in first. Consider soft-delete (set to `inactive`) as the preferred approach over hard delete.

## Employee Self-Service

Employees can view their own profile at `/profile` or `/users/me`:

- See their name, email, role, status
- See their checkout history (what they currently have, what they've returned)
- Upload/change profile picture (existing feature)

## Implementation Notes

### Display Name Utility

The `getDisplayName` function (`server/utils/display-name.ts`) computes the display name from user name fields. It is auto-imported by Nitro in all server routes.

### Dashboard

The dashboard (`/`) serves as a navigation hub with role-aware cards linking to Profile, Users (admin/supervisor only), and Locations.

### Profile Page

The profile page lives at `/profile` and uses `GET /api/users/me` to fetch the current user's data. It includes profile photo upload (moved from the old dashboard) and logout functionality.

## API Routes

| Method | Route                     | Description                                         | Role                              |
| ------ | ------------------------- | --------------------------------------------------- | --------------------------------- |
| GET    | `/api/users`              | List all users (filterable by role, status, search) | Admin, Supervisor                 |
| GET    | `/api/users/[id]`         | Get user detail with checkout stats                 | Admin, Supervisor, or own profile |
| POST   | `/api/users`              | Create user (validates email domain)                | Admin                             |
| PUT    | `/api/users/[id]`         | Update user (recomputes display name)               | Admin                             |
| DELETE | `/api/users/[id]`         | Delete user (blocked if open checkouts)             | Admin                             |
| GET    | `/api/users/me`           | Get current user's profile                          | All                               |
| GET    | `/api/users/[id]/history` | User's checkout history (last 50 entries)           | Admin, Supervisor, or own history |

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

- Card list of all users with: avatar, display name, email, role badge, status badge
- Filterable by role and status
- Sortable: Name A-Z, Name Z-A, Newest first, Oldest first, Recently updated
- Searchable by name or email
- Admin sees "Add User" button and edit actions per row

### User Detail Page

**Route**: `/users/[id]`

Displays:

- Legal name and preferred name (if different)
- Email, role, status
- Profile picture (existing feature)
- Checkout history placeholder (will show items once check-in/out is implemented in #7-#9)
- Admin: edit button, delete button, role/status controls

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

Employees can view their own profile at `/profile`:

- See their name, email, role, status
- Upload/change profile picture
- Logout button

## API Routes

| Method | Route                     | Description                                            | Role                              |
| ------ | ------------------------- | ------------------------------------------------------ | --------------------------------- |
| GET    | `/api/users`              | List all users                                         | Admin, Supervisor                 |
| GET    | `/api/users/[id]`         | Get user detail                                        | Admin, Supervisor, or own profile |
| POST   | `/api/users`              | Create user                                            | Admin                             |
| PUT    | `/api/users/[id]`         | Update user                                            | Admin                             |
| DELETE | `/api/users/[id]`         | Delete user (blocked if open checkouts)                | Admin                             |
| GET    | `/api/users/me`           | Get current user's profile                             | All                               |
| GET    | `/api/users/[id]/history` | User's checkout history (not yet implemented — see #9) | Admin, Supervisor, or own history |

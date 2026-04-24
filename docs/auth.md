# Authentication & Authorization

## Authentication Method

Email OTP via Better Auth with the `emailOTP` plugin. No passwords are stored. Users receive a 6-digit code via email (Nodemailer / Gmail SMTP) and enter it to sign in.

## Domain Restriction

Login is restricted at the server level using a Better Auth `before` hook on sign-in. Only the following are allowed:

- Any `@thewarrencenter.org` email address
- `reachtusharwani@gmail.com`
- `tmw220003@utdallas.edu`

All other emails are rejected before an OTP is sent.

### Implementation

In `server/utils/auth.ts`, add a `before` hook to the `emailOtp.sendVerificationOTP` flow (or use Better Auth's `denySignIn` / pre-login hook) that checks the email domain:

```typescript
// Pseudocode for domain restriction
const ALLOWED_DOMAINS = ['thewarrencenter.org']
const ALLOWED_EMAILS = ['reachtusharwani@gmail.com', 'tmw220003@utdallas.edu']

function isEmailAllowed(email: string): boolean {
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(email.toLowerCase())
}
```

## Authorization (Roles)

Three roles, stored on the User model:

| Role | Permissions |
|---|---|
| **admin** | Full CRUD on locations, items, users. Check in/out items. |
| **supervisor** | Check in/out items (for self and others). Read all data. |
| **employee** | Read-only. Can view items, locations, own checkout history. Cannot perform check-in/out. |

### Where roles are enforced

- **API routes**: Every mutating endpoint checks `session.user.role` before proceeding. Item CRUD endpoints require `admin`. Check-in/out endpoints require `admin` or `supervisor`.
- **UI**: Navigation and action buttons are conditionally rendered based on role. Admin sees management pages (users, locations). Supervisor sees check-in/out actions. Employee sees read-only views.
- **Middleware**: The existing global auth middleware handles authentication. Role-based access is checked per-route or per-action, not globally.

## User Status & Login

| Status | Can log in? | Notes |
|---|---|---|
| `active` | Yes | Normal access |
| `on_leave` | Yes | Can still log in (e.g., to return items), but UI shows indicator |
| `inactive` | No | Login blocked. Admin must reactivate. |

Inactive users should be blocked at the auth level — either via a Better Auth hook that checks status before completing sign-in, or by checking status in the global middleware and redirecting to an "account inactive" page.

## Redirect-After-Login Flow

This is critical for the QR code scanning experience:

1. User scans QR code on an item sticker
2. Phone opens URL: `/items/scan?id=<uuid>`
3. Global auth middleware detects no session
4. Redirect to `/auth?redirect=/items/scan?id=<uuid>`
5. User completes email OTP login
6. On successful login, app reads `redirect` query param
7. Navigate to `/items/scan?id=<uuid>` instead of default `/`

### Implementation

**Auth middleware** — when redirecting to `/auth`, preserve the original path:

```typescript
// In auth.global.ts
if (!session.value && to.path !== '/auth') {
  return navigateTo(`/auth?redirect=${encodeURIComponent(to.fullPath)}`)
}
```

**Login page** — after successful OTP verification, check for redirect:

```typescript
// In auth.vue, after successful signIn
const route = useRoute()
const redirectTo = route.query.redirect as string || '/'
await navigateTo(redirectTo, { external: true })
```

**Auth middleware** — when authenticated user hits `/auth`, respect redirect param too:

```typescript
if (session.value && to.path === '/auth') {
  const redirect = to.query.redirect as string || '/'
  return navigateTo(redirect)
}
```

## Session Validation (Server-Side)

All API routes validate the session before processing:

```typescript
const session = await auth.api.getSession({ headers: event.headers })

if (!session) {
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}

// For role-restricted endpoints:
const user = await prisma.user.findUnique({ where: { id: session.user.id } })

if (user.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}
```

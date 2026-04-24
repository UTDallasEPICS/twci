# Product Requirements

## Overview

An inventory management application for **The Warren Center** (TWC), a pediatric therapy and early intervention nonprofit operating across three locations in the Dallas-Fort Worth area. The app tracks physical equipment — who has it, where it is, and what condition it's in.

## Goals

1. Provide a central system for tracking all equipment across TWC's three locations
2. Enable supervisors and admins to check items in and out to staff members
3. Maintain a complete audit trail of every item's movement and condition changes
4. Support QR code scanning for fast item lookup from any phone
5. Seed the system from the existing employee roster (CSV)

## Users

All ~100 TWC employees will have accounts. Three roles control what they can do:

| Role | Can do |
|---|---|
| **Admin** | CRUD locations, items, users. Check in/out items. Full access. |
| **Supervisor** | Check in/out items (for self and others). View everything. |
| **Employee** | View items and their own checkout history. Items can be checked in/out *for* them by admin/supervisor. |

Initial admins: Brandy Lindsey, Isabel Saenz, Tushar Wani.

## Core Features

### Item Management (Admin only)
- Create, read, update, delete items
- Each item gets a unique QR code generated at creation
- QR codes are printable in multiple label sizes
- Items belong to a location (home location + current location)
- Condition tracking: good, fair, damaged, retired (all transitions allowed)

### Check-in / Check-out (Admin + Supervisor)
- Check out an item from a location to a person
- Check in an item at any location (does not have to match where it was checked out from)
- Condition must be reported on every check-in
- Full audit trail: who, when, where, condition

### Location Management (Admin only)
- CRUD operations on locations
- Three locations seeded at setup

### User Management (Admin only)
- CRUD operations on users
- Assign roles and statuses
- Users seeded from roster CSV at setup

### QR Code Scanning (All roles)
- Scanning a QR code opens the item detail page
- If not logged in, redirect to login, then back to the item page
- Admin/supervisor see check-in/out actions; employees see read-only detail

### Authentication
- Email OTP via Better Auth
- Restricted to `@thewarrencenter.org` domain + two specific external emails
- No unauthenticated access to any data or page

## Deferred / Future

- **Departments**: Items and users may eventually belong to departments within locations. Requirements need client clarification before implementation.
- **Quantity tracking**: Currently each item is individually tracked. Consumable/bulk item tracking may be added later.
- **Item categories/types**: No categorization beyond location assignment at this point.
- **Notifications**: Email alerts for overdue items, condition changes, etc.
- **Expected return dates**: No due-date tracking on checkouts currently.

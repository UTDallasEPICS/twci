import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Validation tests for prisma/seed/users.json — the fixture consumed by
 * prisma/seed.ts. The seed does no parsing, so these tests guard against
 * malformed edits to the fixture (duplicate emails, unknown roles/statuses,
 * blank names) before it ever reaches the database.
 */

type FixtureUser = {
  legalFirstName: string
  legalLastName: string
  preferredFirstName: string | null
  preferredLastName: string | null
  email: string
  role: string
  status: string
}

const USERS: FixtureUser[] = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'seed', 'users.json'), 'utf-8')
)

const VALID_ROLES = ['admin', 'supervisor', 'employee']
const VALID_STATUSES = ['active', 'on_leave']

describe('users fixture', () => {
  it('has a reasonable roster size', () => {
    expect(USERS.length).toBeGreaterThan(100)
  })

  it('has unique emails', () => {
    const emails = USERS.map((u) => u.email)
    expect(new Set(emails).size).toBe(USERS.length)
  })

  it('has lowercase valid email addresses', () => {
    for (const user of USERS) {
      expect(user.email).toBe(user.email.toLowerCase())
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    }
  })

  it('has non-empty legal names', () => {
    for (const user of USERS) {
      expect(user.legalFirstName.trim()).not.toBe('')
      expect(user.legalLastName.trim()).not.toBe('')
    }
  })

  it('has preferred names that are null or non-empty', () => {
    for (const user of USERS) {
      if (user.preferredFirstName !== null) {
        expect(user.preferredFirstName.trim()).not.toBe('')
      }
      if (user.preferredLastName !== null) {
        expect(user.preferredLastName.trim()).not.toBe('')
      }
    }
  })

  it('only uses known roles', () => {
    for (const user of USERS) {
      expect(VALID_ROLES).toContain(user.role)
    }
  })

  it('only uses known statuses', () => {
    for (const user of USERS) {
      expect(VALID_STATUSES).toContain(user.status)
    }
  })

  it('seeds the expected privileged accounts', () => {
    const byEmail = Object.fromEntries(USERS.map((u) => [u.email, u]))

    expect(byEmail['brandy.lindsey@thewarrencenter.org'].role).toBe('admin')
    expect(byEmail['isabel.saenz@thewarrencenter.org'].role).toBe('admin')
    expect(byEmail['reachtusharwani@gmail.com'].role).toBe('admin')
    expect(byEmail['tmw220003@utdallas.edu'].role).toBe('supervisor')
  })
})

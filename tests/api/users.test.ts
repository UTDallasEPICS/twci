import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { isEmailAllowed } from '../../server/utils/auth'
import { getDisplayName } from '../../server/utils/display-name'

// Test the validation schemas and business logic used by user API routes.
// Full integration tests require a running server and will be added when
// the test infrastructure supports it (seeded DB + authenticated requests).

const createUserSchema = z.object({
  legalFirstName: z.string().min(1, 'Required').max(100),
  legalLastName: z.string().min(1, 'Required').max(100),
  preferredFirstName: z.string().max(100).nullable().optional(),
  preferredLastName: z.string().max(100).nullable().optional(),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'supervisor', 'employee']).default('employee'),
  status: z.enum(['active', 'on_leave', 'inactive']).default('active'),
})

const updateUserSchema = z.object({
  legalFirstName: z.string().min(1).max(100).optional(),
  legalLastName: z.string().min(1).max(100).optional(),
  preferredFirstName: z.string().max(100).nullable().optional(),
  preferredLastName: z.string().max(100).nullable().optional(),
  role: z.enum(['admin', 'supervisor', 'employee']).optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
})

describe('user API validation', () => {
  describe('create user schema', () => {
    it('accepts valid user data with defaults', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: 'Jane',
        legalLastName: 'Doe',
        email: 'jane.doe@thewarrencenter.org',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('employee')
        expect(result.data.status).toBe('active')
      }
    })

    it('accepts full user data with all fields', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: 'Jane',
        legalLastName: 'Doe',
        preferredFirstName: 'JD',
        preferredLastName: null,
        email: 'jane.doe@thewarrencenter.org',
        role: 'supervisor',
        status: 'on_leave',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('supervisor')
        expect(result.data.status).toBe('on_leave')
        expect(result.data.preferredFirstName).toBe('JD')
      }
    })

    it('rejects missing required fields', () => {
      const result = createUserSchema.safeParse({
        email: 'test@thewarrencenter.org',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty legal first name', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: '',
        legalLastName: 'Doe',
        email: 'test@thewarrencenter.org',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: 'Jane',
        legalLastName: 'Doe',
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid role', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: 'Jane',
        legalLastName: 'Doe',
        email: 'test@thewarrencenter.org',
        role: 'superadmin',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid status', () => {
      const result = createUserSchema.safeParse({
        legalFirstName: 'Jane',
        legalLastName: 'Doe',
        email: 'test@thewarrencenter.org',
        status: 'suspended',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('update user schema', () => {
    it('accepts partial updates', () => {
      const result = updateUserSchema.safeParse({ role: 'admin' })
      expect(result.success).toBe(true)
    })

    it('accepts empty object (no-op update)', () => {
      const result = updateUserSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts setting preferred name to null', () => {
      const result = updateUserSchema.safeParse({ preferredFirstName: null })
      expect(result.success).toBe(true)
    })

    it('rejects empty legal first name', () => {
      const result = updateUserSchema.safeParse({ legalFirstName: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('email domain validation for user creation', () => {
    it('allows thewarrencenter.org emails', () => {
      expect(isEmailAllowed('new.user@thewarrencenter.org')).toBe(true)
    })

    it('allows explicitly allowlisted emails', () => {
      expect(isEmailAllowed('reachtusharwani@gmail.com')).toBe(true)
    })

    it('rejects other domains', () => {
      expect(isEmailAllowed('user@gmail.com')).toBe(false)
      expect(isEmailAllowed('user@company.com')).toBe(false)
    })
  })

  describe('display name in API responses', () => {
    it('computes display name for API response', () => {
      expect(
        getDisplayName({
          preferredFirstName: 'Chris',
          preferredLastName: null,
          legalFirstName: 'Christopher',
          legalLastName: 'Abernathy',
        })
      ).toBe('Chris Abernathy')
    })
  })
})

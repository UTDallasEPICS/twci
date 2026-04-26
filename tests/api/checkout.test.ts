import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test the validation schema used by the checkout API route.
// Mirrors the schema in server/api/items/[id]/checkout.post.ts.

const checkoutSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

describe('checkout API validation', () => {
  describe('checkout schema', () => {
    it('accepts valid userId', () => {
      const result = checkoutSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing userId', () => {
      const result = checkoutSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects non-UUID userId', () => {
      const result = checkoutSchema.safeParse({ userId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('rejects empty userId', () => {
      const result = checkoutSchema.safeParse({ userId: '' })
      expect(result.success).toBe(false)
    })

    it('rejects non-string userId', () => {
      const result = checkoutSchema.safeParse({ userId: 123 })
      expect(result.success).toBe(false)
    })

    it('ignores extra fields', () => {
      const result = checkoutSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        extra: 'field',
      })
      expect(result.success).toBe(true)
    })
  })
})

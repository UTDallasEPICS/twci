import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test the validation schema used by the checkin API route.
// Mirrors the schema in server/api/items/[id]/checkin.post.ts.

const checkinSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  condition: z.enum(['good', 'fair', 'damaged', 'retired'], {
    error: 'Condition must be good, fair, damaged, or retired',
  }),
})

describe('checkin API validation', () => {
  describe('checkin schema', () => {
    it('accepts valid locationId and condition', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: 'good',
      })
      expect(result.success).toBe(true)
    })

    it('accepts all valid condition values', () => {
      const conditions = ['good', 'fair', 'damaged', 'retired'] as const
      for (const condition of conditions) {
        const result = checkinSchema.safeParse({
          locationId: '550e8400-e29b-41d4-a716-446655440000',
          condition,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects missing locationId', () => {
      const result = checkinSchema.safeParse({ condition: 'good' })
      expect(result.success).toBe(false)
    })

    it('rejects non-UUID locationId', () => {
      const result = checkinSchema.safeParse({
        locationId: 'not-a-uuid',
        condition: 'good',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty locationId', () => {
      const result = checkinSchema.safeParse({
        locationId: '',
        condition: 'good',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing condition', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid condition value', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: 'broken',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty condition', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-string condition', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: 123,
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty body', () => {
      const result = checkinSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('ignores extra fields', () => {
      const result = checkinSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: 'fair',
        extra: 'field',
      })
      expect(result.success).toBe(true)
    })
  })
})

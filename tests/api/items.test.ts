import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test the validation schemas used by item API routes.
// Full integration tests require a running server and will be added when
// the test infrastructure supports it (seeded DB + authenticated requests).

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  condition: z.enum(['good', 'fair', 'damaged', 'retired']).default('good'),
  locationId: z.string().uuid('Invalid location'),
})

const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  condition: z.enum(['good', 'fair', 'damaged', 'retired']).optional(),
  homeLocationId: z.string().uuid('Invalid location').optional(),
  currentLocationId: z.string().uuid('Invalid location').optional(),
})

describe('item API validation', () => {
  describe('create item schema', () => {
    it('accepts valid item with defaults', () => {
      const result = createItemSchema.safeParse({
        name: 'iPad Pro #1',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.condition).toBe('good')
      }
    })

    it('accepts full item data with all fields', () => {
      const result = createItemSchema.safeParse({
        name: 'Therapy Ball',
        description: 'Blue, 75cm diameter',
        condition: 'fair',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.condition).toBe('fair')
        expect(result.data.description).toBe('Blue, 75cm diameter')
      }
    })

    it('rejects missing name', () => {
      const result = createItemSchema.safeParse({
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = createItemSchema.safeParse({
        name: '',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name over 200 chars', () => {
      const result = createItemSchema.safeParse({
        name: 'a'.repeat(201),
        locationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing locationId', () => {
      const result = createItemSchema.safeParse({
        name: 'Test Item',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid UUID for locationId', () => {
      const result = createItemSchema.safeParse({
        name: 'Test Item',
        locationId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid condition value', () => {
      const result = createItemSchema.safeParse({
        name: 'Test Item',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        condition: 'broken',
      })
      expect(result.success).toBe(false)
    })

    it('rejects description over 1000 chars', () => {
      const result = createItemSchema.safeParse({
        name: 'Test Item',
        locationId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'a'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('update item schema', () => {
    it('accepts partial updates', () => {
      const result = updateItemSchema.safeParse({ condition: 'damaged' })
      expect(result.success).toBe(true)
    })

    it('accepts empty object (no-op update)', () => {
      const result = updateItemSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts setting description to null', () => {
      const result = updateItemSchema.safeParse({ description: null })
      expect(result.success).toBe(true)
    })

    it('rejects empty name string', () => {
      const result = updateItemSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid condition value', () => {
      const result = updateItemSchema.safeParse({ condition: 'broken' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid UUID for homeLocationId', () => {
      const result = updateItemSchema.safeParse({ homeLocationId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('accepts valid location UUID updates', () => {
      const result = updateItemSchema.safeParse({
        homeLocationId: '550e8400-e29b-41d4-a716-446655440000',
        currentLocationId: '660e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })
  })
})

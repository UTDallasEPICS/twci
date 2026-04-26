import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Response schema matching the shape returned by GET /api/items/[id]/history
const historyEntrySchema = z.object({
  id: z.string(),
  user: z.object({ id: z.string(), name: z.string() }),
  checkedOutBy: z.object({ id: z.string(), name: z.string() }),
  checkedOutFromLocation: z.object({ id: z.string(), name: z.string() }),
  checkedOutAt: z.string(),
  checkedInBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  checkedInAtLocation: z.object({ id: z.string(), name: z.string() }).nullable(),
  checkedInAt: z.string().nullable(),
  conditionOnReturn: z.string().nullable(),
  isOpen: z.boolean(),
})

const historyResponseSchema = z.array(historyEntrySchema)

// Extracted logic: compute isOpen from a log entry
function computeIsOpen(checkedInAt: string | null): boolean {
  return checkedInAt === null
}

describe('item history response shape', () => {
  it('validates a complete closed checkout entry', () => {
    const entry = {
      id: 'log-1',
      user: { id: 'user-1', name: 'Chris Abernathy' },
      checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
      checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
      checkedOutAt: '2026-04-20T10:00:00.000Z',
      checkedInBy: { id: 'admin-2', name: 'Isabel Saenz' },
      checkedInAtLocation: { id: 'loc-2', name: 'TWC - East' },
      checkedInAt: '2026-04-24T14:00:00.000Z',
      conditionOnReturn: 'good',
      isOpen: false,
    }
    const result = historyResponseSchema.safeParse([entry])
    expect(result.success).toBe(true)
  })

  it('validates an open checkout entry with null check-in fields', () => {
    const entry = {
      id: 'log-2',
      user: { id: 'user-2', name: 'Dana Dodgen' },
      checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
      checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
      checkedOutAt: '2026-04-25T09:00:00.000Z',
      checkedInBy: null,
      checkedInAtLocation: null,
      checkedInAt: null,
      conditionOnReturn: null,
      isOpen: true,
    }
    const result = historyResponseSchema.safeParse([entry])
    expect(result.success).toBe(true)
  })

  it('validates empty history array', () => {
    const result = historyResponseSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('rejects entry missing required fields', () => {
    const result = historyEntrySchema.safeParse({ id: 'log-1' })
    expect(result.success).toBe(false)
  })
})

describe('isOpen computation', () => {
  it('returns true when checkedInAt is null', () => {
    expect(computeIsOpen(null)).toBe(true)
  })

  it('returns false when checkedInAt has a value', () => {
    expect(computeIsOpen('2026-04-24T14:00:00.000Z')).toBe(false)
  })
})

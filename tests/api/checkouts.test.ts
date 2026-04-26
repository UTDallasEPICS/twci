import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Response schema for GET /api/checkouts/open
const openCheckoutEntrySchema = z.object({
  id: z.string(),
  item: z.object({ id: z.string(), name: z.string(), condition: z.string() }),
  user: z.object({ id: z.string(), name: z.string() }),
  checkedOutBy: z.object({ id: z.string(), name: z.string() }),
  checkedOutFromLocation: z.object({ id: z.string(), name: z.string() }),
  checkedOutAt: z.string(),
  daysOut: z.number().int().min(0),
})

const openCheckoutsResponseSchema = z.object({
  checkouts: z.array(openCheckoutEntrySchema),
  total: z.number().int().min(0),
})

// Extracted logic: compute daysOut
function computeDaysOut(checkedOutAt: string, now: number): number {
  return Math.ceil((now - new Date(checkedOutAt).getTime()) / 86_400_000)
}

describe('open checkouts response shape', () => {
  it('validates a response with checkouts', () => {
    const response = {
      checkouts: [
        {
          id: 'log-1',
          item: { id: 'item-1', name: 'iPad Pro #3', condition: 'good' },
          user: { id: 'user-1', name: 'Chris Abernathy' },
          checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
          checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
          checkedOutAt: '2026-04-20T10:00:00.000Z',
          daysOut: 5,
        },
      ],
      total: 1,
    }
    const result = openCheckoutsResponseSchema.safeParse(response)
    expect(result.success).toBe(true)
  })

  it('validates an empty response', () => {
    const result = openCheckoutsResponseSchema.safeParse({ checkouts: [], total: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects negative daysOut', () => {
    const entry = {
      id: 'log-1',
      item: { id: 'item-1', name: 'iPad', condition: 'good' },
      user: { id: 'user-1', name: 'Test' },
      checkedOutBy: { id: 'admin-1', name: 'Admin' },
      checkedOutFromLocation: { id: 'loc-1', name: 'Loc' },
      checkedOutAt: '2026-04-20T10:00:00.000Z',
      daysOut: -1,
    }
    const result = openCheckoutEntrySchema.safeParse(entry)
    expect(result.success).toBe(false)
  })
})

describe('daysOut computation', () => {
  it('returns 1 for a checkout made less than 24 hours ago', () => {
    const now = new Date('2026-04-25T10:00:00.000Z').getTime()
    expect(computeDaysOut('2026-04-25T08:00:00.000Z', now)).toBe(1)
  })

  it('returns 1 for exactly 24 hours', () => {
    const now = new Date('2026-04-26T10:00:00.000Z').getTime()
    expect(computeDaysOut('2026-04-25T10:00:00.000Z', now)).toBe(1)
  })

  it('returns 5 for a checkout made 5 days ago', () => {
    const now = new Date('2026-04-25T10:00:00.000Z').getTime()
    expect(computeDaysOut('2026-04-20T10:00:00.000Z', now)).toBe(5)
  })

  it('returns 31 for a checkout made 31 days ago', () => {
    const now = new Date('2026-04-25T10:00:00.000Z').getTime()
    expect(computeDaysOut('2026-03-25T10:00:00.000Z', now)).toBe(31)
  })
})

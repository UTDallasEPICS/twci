import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Response schema matching the shape returned by GET /api/users/[id]/history
const userHistoryEntrySchema = z.object({
  id: z.string(),
  item: z.object({ id: z.string(), name: z.string() }),
  checkedOutBy: z.object({ id: z.string(), name: z.string() }),
  checkedOutFromLocation: z.object({ id: z.string(), name: z.string() }),
  checkedOutAt: z.string(),
  checkedInBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  checkedInAtLocation: z.object({ id: z.string(), name: z.string() }).nullable(),
  checkedInAt: z.string().nullable(),
  conditionOnReturn: z.string().nullable(),
  isOpen: z.boolean(),
})

const userHistoryResponseSchema = z.array(userHistoryEntrySchema)

describe('user history response shape', () => {
  it('validates a complete closed checkout entry', () => {
    const entry = {
      id: 'log-1',
      item: { id: 'item-1', name: 'iPad Pro #3' },
      checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
      checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
      checkedOutAt: '2026-04-20T10:00:00.000Z',
      checkedInBy: { id: 'admin-2', name: 'Isabel Saenz' },
      checkedInAtLocation: { id: 'loc-2', name: 'TWC - East' },
      checkedInAt: '2026-04-24T14:00:00.000Z',
      conditionOnReturn: 'good',
      isOpen: false,
    }
    const result = userHistoryResponseSchema.safeParse([entry])
    expect(result.success).toBe(true)
  })

  it('validates an open checkout entry', () => {
    const entry = {
      id: 'log-2',
      item: { id: 'item-2', name: 'Therapy Ball' },
      checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
      checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
      checkedOutAt: '2026-04-25T09:00:00.000Z',
      checkedInBy: null,
      checkedInAtLocation: null,
      checkedInAt: null,
      conditionOnReturn: null,
      isOpen: true,
    }
    const result = userHistoryResponseSchema.safeParse([entry])
    expect(result.success).toBe(true)
  })

  it('validates empty history array', () => {
    const result = userHistoryResponseSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('rejects entry with item field instead having user field shape', () => {
    const badEntry = {
      id: 'log-1',
      user: { id: 'user-1', name: 'Someone' },
      checkedOutBy: { id: 'admin-1', name: 'Brandy Lindsey' },
      checkedOutFromLocation: { id: 'loc-1', name: 'TWC - Central' },
      checkedOutAt: '2026-04-20T10:00:00.000Z',
      checkedInBy: null,
      checkedInAtLocation: null,
      checkedInAt: null,
      conditionOnReturn: null,
      isOpen: true,
    }
    const result = userHistoryEntrySchema.safeParse(badEntry)
    expect(result.success).toBe(false)
  })
})

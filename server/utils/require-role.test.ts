import { describe, it, expect } from 'vitest'
import { requireRole } from './require-role'
import type { H3Event } from 'h3'

function mockEvent(role?: string): H3Event {
  return {
    context: {
      session: role ? { user: { role } } : null,
    },
  } as unknown as H3Event
}

describe('requireRole', () => {
  it('allows access when user has the required role', () => {
    expect(() => requireRole(mockEvent('admin'), 'admin')).not.toThrow()
  })

  it('allows access when user has one of multiple allowed roles', () => {
    expect(() => requireRole(mockEvent('supervisor'), 'admin', 'supervisor')).not.toThrow()
  })

  it('throws 403 when user role does not match', () => {
    expect(() => requireRole(mockEvent('employee'), 'admin')).toThrow()
  })

  it('throws 403 when session is missing', () => {
    const event = { context: {} } as unknown as H3Event
    expect(() => requireRole(event, 'admin')).toThrow()
  })
})

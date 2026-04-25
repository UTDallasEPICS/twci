import { describe, it, expect } from 'vitest'
import { isEmailAllowed } from './auth'

describe('isEmailAllowed', () => {
  it('allows @thewarrencenter.org emails', () => {
    expect(isEmailAllowed('anyone@thewarrencenter.org')).toBe(true)
    expect(isEmailAllowed('ADMIN@THEWARRENCENTER.ORG')).toBe(true)
  })

  it('allows explicitly allowlisted emails', () => {
    expect(isEmailAllowed('reachtusharwani@gmail.com')).toBe(true)
    expect(isEmailAllowed('tmw220003@utdallas.edu')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isEmailAllowed('ReachTusharWani@Gmail.com')).toBe(true)
    expect(isEmailAllowed('TMW220003@UTDallas.EDU')).toBe(true)
  })

  it('rejects non-allowed emails', () => {
    expect(isEmailAllowed('random@gmail.com')).toBe(false)
    expect(isEmailAllowed('hacker@evil.com')).toBe(false)
    expect(isEmailAllowed('test@thewarrencenter.com')).toBe(false)
  })

  it('rejects empty or malformed emails', () => {
    expect(isEmailAllowed('')).toBe(false)
    expect(isEmailAllowed('nodomain')).toBe(false)
  })
})

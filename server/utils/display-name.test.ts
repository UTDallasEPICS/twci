import { describe, it, expect } from 'vitest'
import { getDisplayName } from './display-name'

describe('getDisplayName', () => {
  it('returns preferred names when both are set', () => {
    expect(
      getDisplayName({
        legalFirstName: 'Christopher',
        legalLastName: 'Abernathy',
        preferredFirstName: 'Chris',
        preferredLastName: 'Aber',
      })
    ).toBe('Chris Aber')
  })

  it('falls back to legal names when no preferred names', () => {
    expect(
      getDisplayName({
        legalFirstName: 'Christopher',
        legalLastName: 'Abernathy',
        preferredFirstName: null,
        preferredLastName: null,
      })
    ).toBe('Christopher Abernathy')
  })

  it('mixes preferred first with legal last', () => {
    expect(
      getDisplayName({
        legalFirstName: 'Christopher',
        legalLastName: 'Abernathy',
        preferredFirstName: 'Chris',
        preferredLastName: null,
      })
    ).toBe('Chris Abernathy')
  })

  it('mixes legal first with preferred last', () => {
    expect(
      getDisplayName({
        legalFirstName: 'Christopher',
        legalLastName: 'Abernathy',
        preferredFirstName: null,
        preferredLastName: 'Aber',
      })
    ).toBe('Christopher Aber')
  })

  it('returns first name only when no last name', () => {
    expect(
      getDisplayName({
        legalFirstName: 'Chris',
        legalLastName: null,
        preferredFirstName: null,
        preferredLastName: null,
      })
    ).toBe('Chris')
  })

  it('falls back to name field when no legal/preferred names', () => {
    expect(
      getDisplayName({
        legalFirstName: null,
        legalLastName: null,
        preferredFirstName: null,
        preferredLastName: null,
        name: 'Fallback Name',
      })
    ).toBe('Fallback Name')
  })

  it('returns empty string when nothing is set', () => {
    expect(getDisplayName({})).toBe('')
  })
})

import { describe, expect, it } from 'vitest'

// Re-implement the pure helper functions from seed.ts for testing
// (seed.ts runs as a script, so we test the logic directly)

const ADMIN_EMAILS = [
  'brandy.lindsey@thewarrencenter.org',
  'isabel.saenz@thewarrencenter.org',
  'reachtusharwani@gmail.com',
]

const SUPERVISOR_EMAILS = ['tmw220003@utdallas.edu']

function getRole(email: string): string {
  const lower = email.toLowerCase()
  if (ADMIN_EMAILS.includes(lower)) return 'admin'
  if (SUPERVISOR_EMAILS.includes(lower)) return 'supervisor'
  return 'employee'
}

function mapStatus(positionStatus: string): string {
  const normalized = positionStatus.trim().toLowerCase()
  if (normalized === 'leave') return 'on_leave'
  return 'active'
}

function parseLegalName(legalName: string): { firstName: string; lastName: string } {
  const commaIndex = legalName.indexOf(',')
  const lastName = legalName.substring(0, commaIndex).trim()
  const firstName = legalName.substring(commaIndex + 1).trim()
  return { firstName, lastName }
}

function computeDisplayName(
  legalFirst: string,
  legalLast: string,
  preferredFirst: string | null,
  preferredLast: string | null
): string {
  const displayFirst = preferredFirst || legalFirst
  const displayLast = preferredLast || legalLast
  return `${displayFirst} ${displayLast}`
}

describe('seed helpers', () => {
  describe('getRole', () => {
    it('returns admin for admin emails', () => {
      expect(getRole('brandy.lindsey@thewarrencenter.org')).toBe('admin')
      expect(getRole('isabel.saenz@thewarrencenter.org')).toBe('admin')
      expect(getRole('reachtusharwani@gmail.com')).toBe('admin')
    })

    it('returns supervisor for supervisor emails', () => {
      expect(getRole('tmw220003@utdallas.edu')).toBe('supervisor')
    })

    it('returns employee for all other emails', () => {
      expect(getRole('someone@thewarrencenter.org')).toBe('employee')
      expect(getRole('random@gmail.com')).toBe('employee')
    })
  })

  describe('mapStatus', () => {
    it('maps Active to active', () => {
      expect(mapStatus('Active')).toBe('active')
    })

    it('maps Leave to on_leave', () => {
      expect(mapStatus('Leave')).toBe('on_leave')
    })

    it('handles whitespace', () => {
      expect(mapStatus(' Leave ')).toBe('on_leave')
      expect(mapStatus(' Active ')).toBe('active')
    })
  })

  describe('parseLegalName', () => {
    it('parses simple names', () => {
      expect(parseLegalName('Abernathy, Christopher')).toEqual({
        firstName: 'Christopher',
        lastName: 'Abernathy',
      })
    })

    it('handles multi-word last names', () => {
      expect(parseLegalName('Hernandez Kilpatrick, Hilda')).toEqual({
        firstName: 'Hilda',
        lastName: 'Hernandez Kilpatrick',
      })
    })

    it('handles multi-word first names', () => {
      expect(parseLegalName('Camacho, Janina Lizz')).toEqual({
        firstName: 'Janina Lizz',
        lastName: 'Camacho',
      })
    })
  })

  describe('computeDisplayName', () => {
    it('uses legal names when no preferred names', () => {
      expect(computeDisplayName('Christopher', 'Abernathy', null, null)).toBe(
        'Christopher Abernathy'
      )
    })

    it('uses preferred first name when available', () => {
      expect(computeDisplayName('Christopher', 'Abernathy', 'Chris', null)).toBe('Chris Abernathy')
    })

    it('uses preferred last name when available', () => {
      expect(computeDisplayName('Christopher', 'Abernathy', null, 'Smith')).toBe(
        'Christopher Smith'
      )
    })

    it('uses both preferred names when available', () => {
      expect(computeDisplayName('Christopher', 'Abernathy', 'Chris', 'Smith')).toBe('Chris Smith')
    })
  })
})

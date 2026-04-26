import { describe, expect, it } from 'vitest'

function clampSize(raw: unknown): number {
  return Math.min(1000, Math.max(100, Number(raw) || 400))
}

describe('QR endpoint size validation', () => {
  it('defaults to 400 when no size provided', () => {
    expect(clampSize(undefined)).toBe(400)
  })

  it('defaults to 400 for non-numeric input', () => {
    expect(clampSize('abc')).toBe(400)
    expect(clampSize('')).toBe(400)
    expect(clampSize(null)).toBe(400)
  })

  it('clamps to minimum 100', () => {
    expect(clampSize(50)).toBe(100)
    expect(clampSize(1)).toBe(100)
    expect(clampSize(-10)).toBe(100)
  })

  it('clamps to maximum 1000', () => {
    expect(clampSize(2000)).toBe(1000)
    expect(clampSize(1500)).toBe(1000)
  })

  it('accepts valid sizes within range', () => {
    expect(clampSize(200)).toBe(200)
    expect(clampSize(400)).toBe(400)
    expect(clampSize(800)).toBe(800)
  })

  it('accepts boundary values', () => {
    expect(clampSize(100)).toBe(100)
    expect(clampSize(1000)).toBe(1000)
  })
})

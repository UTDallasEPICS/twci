import { describe, expect, it } from 'vitest'
import { generateQRCode } from './qr'

describe('generateQRCode', () => {
  it('returns a Buffer', async () => {
    const result = await generateQRCode('test-id', 'https://example.com')
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('returns valid PNG data', async () => {
    const result = await generateQRCode('test-id', 'https://example.com')
    // PNG magic bytes
    expect(result[0]).toBe(0x89)
    expect(result[1]).toBe(0x50) // P
    expect(result[2]).toBe(0x4e) // N
    expect(result[3]).toBe(0x47) // G
  })

  it('accepts custom size', async () => {
    const small = await generateQRCode('test-id', 'https://example.com', 100)
    const large = await generateQRCode('test-id', 'https://example.com', 800)
    expect(Buffer.isBuffer(small)).toBe(true)
    expect(Buffer.isBuffer(large)).toBe(true)
    expect(large.length).toBeGreaterThan(small.length)
  })

  it('produces non-empty output for valid UUID input', async () => {
    const result = await generateQRCode(
      '550e8400-e29b-41d4-a716-446655440000',
      'https://app.example.com'
    )
    expect(result.length).toBeGreaterThan(0)
  })
})

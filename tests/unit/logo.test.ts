import { describe, expect, it } from 'vitest'
import { LOGO_MIME_TYPES, hasImageSignature } from '@/lib/validations/organization'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
const text = (s: string) => new TextEncoder().encode(s)

describe('logo : signature des fichiers', () => {
  it('accepte les vraies images PNG, JPEG et WebP', () => {
    expect(hasImageSignature(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 'image/png')).toBe(true)
    expect(hasImageSignature(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg')).toBe(true)
    expect(hasImageSignature(text('RIFF\x24\x00\x00\x00WEBPVP8 '), 'image/webp')).toBe(true)
  })

  it('refuse un contenu qui ne correspond pas au type annoncé', () => {
    // SVG ou HTML (pouvant contenir du JavaScript) déguisés en PNG
    expect(hasImageSignature(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'image/png')).toBe(false)
    expect(hasImageSignature(text('<!doctype html><script>alert(1)</script>'), 'image/jpeg')).toBe(false)
    // JPEG annoncé comme PNG, fichier RIFF qui n'est pas du WebP (ex. WAV)
    expect(hasImageSignature(bytes(0xff, 0xd8, 0xff), 'image/png')).toBe(false)
    expect(hasImageSignature(text('RIFF\x24\x00\x00\x00WAVEfmt '), 'image/webp')).toBe(false)
    expect(hasImageSignature(new Uint8Array(), 'image/png')).toBe(false)
  })

  it('n’accepte plus le SVG', () => {
    expect(LOGO_MIME_TYPES).not.toContain('image/svg+xml')
    expect(hasImageSignature(text('<svg/>'), 'image/svg+xml')).toBe(false)
  })
})

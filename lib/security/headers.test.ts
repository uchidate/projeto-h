import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS } from './headers.mjs'

describe('SECURITY_HEADERS', () => {
    const byName = new Map(SECURITY_HEADERS.map(({ key, value }) => [key.toLowerCase(), value]))

    it('não contém nomes duplicados ou vazios', () => {
        expect(byName.size).toBe(SECURITY_HEADERS.length)
        expect(SECURITY_HEADERS.every(({ key, value }) => key.length > 0 && value.length > 0)).toBe(true)
    })

    it('impede downgrade HTTPS, sniffing e clickjacking', () => {
        expect(byName.get('strict-transport-security')).toBe('max-age=31536000')
        expect(byName.get('x-content-type-options')).toBe('nosniff')
        expect(byName.get('x-frame-options')).toBe('DENY')
    })

    it('nega recursos de hardware que o site não utiliza', () => {
        expect(byName.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()')
    })
})

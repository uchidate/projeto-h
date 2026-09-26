import { describe, it, expect } from 'vitest'
import type { WPProduction } from '@/lib/wordpress/types'
import { producaoMagra } from './fichaMagra'

const prod = (over: Record<string, unknown> = {}) =>
    ({ content: { rendered: 'x'.repeat(250) }, production_cast: [], acf: {}, ...over }) as unknown as WPProduction

describe('producaoMagra', () => {
    it('é magra com texto curto e nada além', () => {
        expect(producaoMagra(prod())).toBe(true)
    })
    it('não é magra com texto longo', () => {
        expect(producaoMagra(prod({ content: { rendered: 'x'.repeat(900) } }))).toBe(false)
    })
    it.each([
        ['elenco', { production_cast: [{ slug: 'a', role: 'b' }] }],
        ['curiosidades', { acf: { curiosidades: ['a'] } }],
        ['trailer', { acf: { trailer_url: 'https://youtu.be/x' } }],
        ['galeria', { acf: { gallery_urls: ['a.jpg'] } }],
    ])('não é magra com %s', (_n, over) => {
        expect(producaoMagra(prod(over))).toBe(false)
    })
})

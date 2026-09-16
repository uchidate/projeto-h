import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './serialize'

describe('serializeJsonLd', () => {
    it('remove campos nulos sem remover valores falsy válidos', () => {
        expect(JSON.parse(serializeJsonLd({ empty: null, zero: 0, enabled: false })))
            .toEqual({ zero: 0, enabled: false })
    })

    it('impede conteúdo externo de encerrar a tag script', () => {
        const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' })

        expect(serialized).not.toContain('<')
        expect(JSON.parse(serialized).name).toBe('</script><script>alert(1)</script>')
    })

    it('escapa separadores Unicode problemáticos em JavaScript', () => {
        const serialized = serializeJsonLd({ text: `antes\u2028meio\u2029depois` })

        expect(serialized).toContain('\\u2028')
        expect(serialized).toContain('\\u2029')
    })
})

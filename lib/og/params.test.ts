import { describe, expect, it } from 'vitest'
import { normalizeOgParams, safeOgImageUrl } from './params'

describe('safeOgImageUrl', () => {
    it.each([
        'https://image.tmdb.org/t/p/w500/poster.jpg',
        'https://i.ytimg.com/vi/id/hqdefault.jpg',
        'https://cdn.example.wp.com/image.jpg',
        'https://example.com/wp-content/uploads/2026/image.jpg',
    ])('aceita provedor conhecido: %s', (url) => expect(safeOgImageUrl(url)).toBe(url))

    it.each([
        'http://image.tmdb.org/image.jpg',
        'https://example.com/image.jpg',
        'https://127.0.0.1/internal',
        'https://user:pass@image.tmdb.org/image.jpg',
        'https://image.tmdb.org:8443/image.jpg',
        'https://example.com/api/health',
        'não-é-url',
    ])('rejeita origem ou formato inseguro: %s', (url) => expect(safeOgImageUrl(url)).toBe(''))
})

describe('normalizeOgParams', () => {
    it('compacta espaços, limita textos e normaliza type desconhecido', () => {
        const params = new URLSearchParams({
            title: `  ${'a'.repeat(120)}  `,
            subtitle: `linha  \n  ${'b'.repeat(200)}`,
            type: 'admin',
        })
        const result = normalizeOgParams(params)
        expect(result.title).toHaveLength(100)
        expect(result.subtitle).toHaveLength(180)
        expect(result.subtitle).not.toContain('\n')
        expect(result.type).toBe('')
    })

    it('fornece título padrão quando ausente', () => {
        expect(normalizeOgParams(new URLSearchParams()).title).toBe('Portal')
    })

    it('preserva o tipo agency para compor logos sem corte', () => {
        const result = normalizeOgParams(new URLSearchParams({ type: 'agency' }))
        expect(result.type).toBe('agency')
    })
})

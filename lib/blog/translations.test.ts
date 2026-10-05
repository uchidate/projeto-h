import { describe, expect, it } from 'vitest'
import { buildPostAlternates, versoesDoPost } from './translations'

describe('versoesDoPost', () => {
    it('ignora idioma desconhecido, slug vazio e entrada ausente', () => {
        expect(versoesDoPost({ pt: 'a', en: 'b', xx: 'c', fr: '' })).toEqual({ pt: 'a', en: 'b' })
        expect(versoesDoPost(undefined)).toEqual({})
    })
})

describe('buildPostAlternates', () => {
    it('sem outra versão, só canonical', () => {
        const r = buildPostAlternates({}, 'pt', 'meu-post')
        expect(r.languages).toBeUndefined()
        expect(r.canonical).toMatch(/\/blog\/meu-post$/)
    })
    it('versão EN: canonical auto-referente e hreflang recíproco com slugs próprios', () => {
        const translations = { pt: 'meu-post', en: 'my-post' }
        const en = buildPostAlternates(translations, 'en', 'my-post')
        const pt = buildPostAlternates(translations, 'pt', 'meu-post')
        expect(en.canonical).toMatch(/\/en\/blog\/my-post$/)
        expect(en.languages).toEqual(pt.languages)
        expect(en.languages?.['pt-BR']).toMatch(/\/blog\/meu-post$/)
        expect(en.languages?.en).toMatch(/\/en\/blog\/my-post$/)
        expect(en.languages?.['x-default']).toMatch(/\/blog\/meu-post$/)
    })
})

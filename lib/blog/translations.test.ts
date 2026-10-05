import { describe, expect, it } from 'vitest'
import { buildPostAlternates, cartoesDaListagem, versoesDoPost } from './translations'

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

describe('cartoesDaListagem', () => {
    const originais = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]
    const traducoes = new Map([['b', { slug: 'b-en' }]])
    it('página 1: traduzidos primeiro e o original traduzido não repete', () => {
        const r = cartoesDaListagem(originais, traducoes, 1)
        expect(r.map((c) => c.traduzido?.slug ?? c.original?.slug)).toEqual(['b-en', 'a', 'c'])
    })
    it('páginas seguintes: só os originais sem tradução', () => {
        expect(cartoesDaListagem(originais, traducoes, 2).map((c) => c.original?.slug)).toEqual(['a', 'c'])
    })
    it('sem traduções, a lista não muda', () => {
        expect(cartoesDaListagem(originais, new Map(), 1).map((c) => c.original?.slug)).toEqual(['a', 'b', 'c'])
    })
})

import { describe, expect, it } from 'vitest'
import { buildPostAlternates, fatiaDaListagem, slugPublicoDoPost, versoesDoPost } from './translations'

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
    it('versão EN: canonical e hreflang usam o slug do original em todos os idiomas', () => {
        const translations = { pt: 'meu-post', en: 'my-post' }
        const en = buildPostAlternates(translations, 'en', 'my-post')
        const pt = buildPostAlternates(translations, 'pt', 'meu-post')
        expect(en.canonical).toMatch(/\/en\/blog\/meu-post$/)
        expect(pt.canonical).toMatch(/\/blog\/meu-post$/)
        expect(en.languages).toEqual(pt.languages)
        expect(en.languages?.['pt-BR']).toMatch(/\/blog\/meu-post$/)
        expect(en.languages?.en).toMatch(/\/en\/blog\/meu-post$/)
        expect(en.languages?.['x-default']).toMatch(/\/blog\/meu-post$/)
    })
    it('tradução sem original vinculado mantém o próprio slug', () => {
        const r = buildPostAlternates({ en: 'only-en' }, 'en', 'only-en')
        expect(r.canonical).toMatch(/\/en\/blog\/only-en$/)
    })
})

describe('slugPublicoDoPost', () => {
    it('usa o slug do original; sem ele, o próprio', () => {
        expect(slugPublicoDoPost({ pt: 'meu-post', en: 'my-post' }, 'my-post')).toBe('meu-post')
        expect(slugPublicoDoPost({ en: 'my-post' }, 'my-post')).toBe('my-post')
        expect(slugPublicoDoPost(undefined, 'x')).toBe('x')
    })
})

describe('fatiaDaListagem', () => {
    it('sem traduções, é a paginação normal do português', () => {
        expect(fatiaDaListagem(0, 1, 12)).toEqual({ traduzidos: { inicio: 0, fim: 0 }, portugues: { offset: 0, quantidade: 12 } })
        expect(fatiaDaListagem(0, 3, 12).portugues).toEqual({ offset: 24, quantidade: 12 })
    })
    it('uma tradução: página 1 = 1 traduzido + 11 do português; página 2 continua de onde parou', () => {
        expect(fatiaDaListagem(1, 1, 12)).toEqual({ traduzidos: { inicio: 0, fim: 1 }, portugues: { offset: 0, quantidade: 11 } })
        expect(fatiaDaListagem(1, 2, 12)).toEqual({ traduzidos: { inicio: 1, fim: 1 }, portugues: { offset: 11, quantidade: 12 } })
    })
    it('mais traduções que uma página: cobre tudo sem repetir nem pular', () => {
        const T = 30
        const vistos: string[] = []
        for (let pagina = 1; pagina <= 4; pagina++) {
            const f = fatiaDaListagem(T, pagina, 12)
            for (let i = f.traduzidos.inicio; i < f.traduzidos.fim; i++) vistos.push(`t${i}`)
            for (let i = 0; i < f.portugues.quantidade; i++) vistos.push(`p${f.portugues.offset + i}`)
        }
        expect(vistos.slice(0, 30)).toEqual(Array.from({ length: 30 }, (_, i) => `t${i}`))
        expect(vistos.slice(30, 48)).toEqual(Array.from({ length: 18 }, (_, i) => `p${i}`))
        expect(new Set(vistos).size).toBe(vistos.length)
    })
    it('página só de português depois das traduções: quantidade cheia', () => {
        expect(fatiaDaListagem(5, 2, 12).portugues).toEqual({ offset: 7, quantidade: 12 })
    })
})

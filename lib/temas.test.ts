import { describe, it, expect } from 'vitest'
import { rotaPertenceAoItem, temasComLoja } from './temas'

describe('rotaPertenceAoItem', () => {
    it('mantém a regra de sempre: o próprio href e o que vem depois dele', () => {
        expect(rotaPertenceAoItem('/blog', '/blog')).toBe(true)
        expect(rotaPertenceAoItem('/blog/algum-post', '/blog')).toBe(true)
        expect(rotaPertenceAoItem('/blogue', '/blog')).toBe(false)
        expect(rotaPertenceAoItem('/', '/')).toBe(true)
        expect(rotaPertenceAoItem('/blog', '/')).toBe(false)
    })
    it('Home de um idioma (/en) só acende na própria raiz', () => {
        expect(rotaPertenceAoItem('/en', '/en')).toBe(true)
        expect(rotaPertenceAoItem('/en/foods', '/en')).toBe(false)
        expect(rotaPertenceAoItem('/en/foods', '/en/foods')).toBe(true)
    })
    it('Gastronomia acende em /comidas e nas fichas; Cultura só no hub dela', () => {
        expect(rotaPertenceAoItem('/comidas', '/comidas')).toBe(true)
        expect(rotaPertenceAoItem('/comidas/pepero', '/comidas')).toBe(true)
        expect(rotaPertenceAoItem('/comidas/pepero', '/cultura-coreana-101')).toBe(false)
        expect(rotaPertenceAoItem('/empresas/lotte', '/comidas')).toBe(false)
        expect(rotaPertenceAoItem('/comidasx', '/comidas')).toBe(false)
        expect(rotaPertenceAoItem(null, '/blog')).toBe(false)
    })
})

describe('rotaPertenceAoItem com categoria do blog', () => {
    it('/blog?category=comida não acende Notícias', () => {
        expect(rotaPertenceAoItem('/blog', '/blog', 'comida')).toBe(false)
    })
    it('categoria sem tema ou sem categoria mantém Notícias', () => {
        expect(rotaPertenceAoItem('/blog', '/blog', 'k-pop')).toBe(true)
        expect(rotaPertenceAoItem('/blog', '/blog', null)).toBe(true)
    })
})

describe('temasComLoja', () => {
    it('K-beauty, comida e merch têm categoria e loja ligadas', () => {
        expect(temasComLoja().map(t => t.id)).toEqual(['k-beauty', 'comida', 'merch'])
    })
})

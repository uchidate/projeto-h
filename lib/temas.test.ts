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
    it('Gastronomia acende em /comidas e nas fichas; Cultura só no hub dela', () => {
        expect(rotaPertenceAoItem('/comidas', '/comidas')).toBe(true)
        expect(rotaPertenceAoItem('/comidas/pepero', '/comidas')).toBe(true)
        expect(rotaPertenceAoItem('/comidas/pepero', '/cultura-coreana-101')).toBe(false)
        expect(rotaPertenceAoItem('/empresas/lotte', '/comidas')).toBe(false)
        expect(rotaPertenceAoItem('/comidasx', '/comidas')).toBe(false)
        expect(rotaPertenceAoItem(null, '/blog')).toBe(false)
    })
})

describe('temasComLoja', () => {
    it('K-beauty e comida têm categoria, loja e marcas', () => {
        expect(temasComLoja().map(t => t.id)).toEqual(['k-beauty', 'comida'])
    })
})

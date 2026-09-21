import { describe, expect, it } from 'vitest'
import { grafiasAlternativas } from './grafias'

describe('grafiasAlternativas', () => {
    it('cobre a busca real "mu jin-sung" para a página "Moo Jin-sung"', () => {
        const g = grafiasAlternativas('Moo Jin-sung')
        expect(g).toContain('Mu Jin-sung')
        expect(g).toContain('Moo Jinsung')
        expect(g).toContain('Jin-sung Moo')
    })

    it('nunca repete o nome original, nem varia só a caixa', () => {
        const g = grafiasAlternativas('Lee Sung-min')
        expect(g).not.toContain('Lee Sung-min')
        expect(g).not.toContain('lee sung-min')
        expect(new Set(g.map(x => x.toLowerCase())).size).toBe(g.length)
    })

    it('inverte a ordem só quando o nome tem exatamente duas partes', () => {
        expect(grafiasAlternativas('Kim Min Jun')).not.toContain('Jun Min Kim')
        expect(grafiasAlternativas('Kim Min-jun')).toContain('Min-jun Kim')
    })

    it('nome de uma palavra sem oo nem hífen não tem variante', () => {
        expect(grafiasAlternativas('Kangnam')).toEqual([])
        expect(grafiasAlternativas('Hanni')).toEqual([])
    })

    it('respeita o limite', () => {
        expect(grafiasAlternativas('Yoo Jae-suk', 2)).toHaveLength(2)
    })

    it('ignora hangul, vazio e nulo', () => {
        expect(grafiasAlternativas('무진성')).toEqual([])
        expect(grafiasAlternativas('')).toEqual([])
        expect(grafiasAlternativas(undefined)).toEqual([])
        expect(grafiasAlternativas(null)).toEqual([])
    })
})

import { describe, it, expect } from 'vitest'
import { catStyle, isRecent, postReadingTime } from './catStyle'

/** Luminância relativa + contraste WCAG 2.1 — mesma fórmula usada no axe-core. */
function luminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map(c => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    const toHex = (n: number) => Math.round(255 * f(n)).toString(16).padStart(2, '0')
    return `#${toHex(0)}${toHex(8)}${toHex(4)}`
}

function contrast(hex1: string, hex2: string): number {
    const l1 = luminance(hex1)
    const l2 = luminance(hex2)
    const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (a + 0.05) / (b + 0.05)
}

// Regressão do fix de 2026-07-06: a paleta original falhava em 7/9 categorias
// (pior caso 2.91:1). Trava aqui pra ninguém "ajeitar a cor" sem checar contraste.
describe('catStyle — categorias conhecidas mantêm WCAG AA (4.5:1)', () => {
    const KNOWN_SLUGS = ['k-pop', 'k-drama', 'cultura', 'noticias', 'musica', 'cinema', 'grupos', 'artistas', 'guias']

    it.each(KNOWN_SLUGS)('%s: texto contra o próprio fundo passa 4.5:1', slug => {
        const { bg, color } = catStyle(slug)
        expect(contrast(color, bg)).toBeGreaterThanOrEqual(4.5)
    })
})

describe('catStyle — fallback por hash (slugs desconhecidos)', () => {
    it('retorna a mesma cor de forma determinística pro mesmo slug', () => {
        expect(catStyle('categoria-nova')).toEqual(catStyle('categoria-nova'))
    })

    it('retorna cores diferentes pra slugs diferentes (via hash)', () => {
        const a = catStyle('categoria-a')
        const b = catStyle('categoria-b')
        expect(a).not.toEqual(b)
    })

    it('passa 4.5:1 no pior caso testado em todo o espectro de matizes (regressão do fix l=38%→28%)', () => {
        let worst = Infinity
        for (let hue = 0; hue < 360; hue += 5) {
            const bg = hslToHex(hue, 60, 96)
            const color = hslToHex(hue, 55, 28)
            worst = Math.min(worst, contrast(color, bg))
        }
        expect(worst).toBeGreaterThanOrEqual(4.5)
    })

    it('retorna cor default quando slug é undefined', () => {
        expect(catStyle(undefined)).toEqual({ bg: '#f5f5f5', color: '#555' })
    })

    it('retorna cor default quando slug é string vazia', () => {
        expect(catStyle('')).toEqual({ bg: '#f5f5f5', color: '#555' })
    })
})

describe('isRecent', () => {
    it('retorna true para uma data de hoje', () => {
        expect(isRecent(new Date().toISOString())).toBe(true)
    })

    it('retorna true pra uma data de 3 dias atrás', () => {
        const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        expect(isRecent(d.toISOString())).toBe(true)
    })

    it('retorna false pra uma data de 8 dias atrás', () => {
        const d = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        expect(isRecent(d.toISOString())).toBe(false)
    })

    it('retorna false bem no limite dos 7 dias (7 dias e 1 minuto atrás)', () => {
        const d = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000 + 60_000))
        expect(isRecent(d.toISOString())).toBe(false)
    })
})

describe('postReadingTime', () => {
    it('prefere o valor autoral do ACF', () => {
        expect(postReadingTime({ acf: { reading_time: 7 }, content: { rendered: 'uma palavra' } })).toBe(7)
    })

    it('calcula pelo conteúdo quando não há valor autoral', () => {
        const html = `<p>${'palavra '.repeat(400)}</p>`
        expect(postReadingTime({ acf: null, content: { rendered: html } })).toBe(2)
    })

    it('devolve null quando não há conteúdo nem ACF, em vez de inventar 1 min', () => {
        // Regressão: a barra lateral chamava readingTime('') — que tem piso 1 —
        // sobre posts buscados sem o campo `content`, e anunciava "1 min" para
        // todo post do site, contradizendo a grade ao lado.
        expect(postReadingTime({ acf: null })).toBeNull()
        expect(postReadingTime({ acf: { reading_time: 0 }, content: { rendered: '' } })).toBeNull()
    })
})

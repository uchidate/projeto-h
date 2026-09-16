import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homeCatStyle, homeCatName, nameToGradient } from './catStyle'
import type { WPPost } from '@/lib/wordpress/types'

function post(overrides: Partial<WPPost> = {}): WPPost {
    return { id: 1, ...overrides } as WPPost
}

describe('homeCatStyle / homeCatName — resolução de categoria', () => {
    it('usa o termo _embedded quando presente (prioridade sobre categoryMap)', () => {
        const p = post({ _embedded: { 'wp:term': [[{ id: 9, name: 'K-Drama', slug: 'k-drama' }]] } } as unknown as Partial<WPPost>)
        expect(homeCatName(p)).toBe('K-Drama')
        expect(homeCatStyle(p).color).toBe('var(--home-cat-k-drama)')
    })

    it('cai pro categoryMap quando não há _embedded', () => {
        const p = post({ categories: [42] })
        const map = { 42: { name: 'Cultura', slug: 'cultura' } }
        expect(homeCatName(p, map)).toBe('Cultura')
        expect(homeCatStyle(p, map).color).toBe('var(--home-cat-cultura)')
    })

    it('retorna "Artigo" e a cor default quando não há nem _embedded nem categoryMap', () => {
        expect(homeCatName(post())).toBe('Artigo')
        expect(homeCatStyle(post()).color).toBe('var(--home-cat-k-drama)')
    })

    it('categoryMap não tem a categoria do post → mesmo fallback', () => {
        const p = post({ categories: [999] })
        expect(homeCatName(p, { 1: { name: 'X', slug: 'x' } })).toBe('Artigo')
    })

    it('slug desconhecido (fora da paleta) cai pra k-drama, mas mantém o nome real', () => {
        const p = post({ _embedded: { 'wp:term': [[{ id: 1, name: 'Categoria Nova', slug: 'categoria-inexistente-na-paleta' }]] } } as unknown as Partial<WPPost>)
        expect(homeCatName(p)).toBe('Categoria Nova')
        expect(homeCatStyle(p).color).toBe('var(--home-cat-k-drama)')
    })

    it('bg é sempre um color-mix com 12.5% da cor sobre transparent', () => {
        const style = homeCatStyle(post({ _embedded: { 'wp:term': [[{ id: 1, name: 'K-Pop', slug: 'k-pop' }]] } } as unknown as Partial<WPPost>))
        expect(style.bg).toBe('color-mix(in srgb, var(--home-cat-k-pop) 12.5%, transparent)')
    })
})

// Regressão do fix de 2026-07-06: a paleta original em hex fixo não passava
// WCAG AA em nenhum dos dois temas simultaneamente pra quase nenhuma
// categoria (contraste calculado contra o próprio fundo translúcido sobre
// --color-bg do tema). Trava aqui que os valores definidos em globals.css
// continuam passando 4.5:1 nos dois temas.
describe('--home-cat-* em globals.css — contraste WCAG AA (4.5:1)', () => {
    function luminance(hex: string): number {
        const h = hex.replace('#', '')
        const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
        const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    function contrast(hex1: string, hex2: string): number {
        const l1 = luminance(hex1), l2 = luminance(hex2)
        const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1]
        return (a + 0.05) / (b + 0.05)
    }
    function blend(fgHex: string, alpha: number, bgHex: string): string {
        const f = fgHex.replace('#', ''), b = bgHex.replace('#', '')
        const [fr, fg, fb] = [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16))
        const [br, bg, bb] = [0, 2, 4].map(i => parseInt(b.slice(i, i + 2), 16))
        const mix = (fc: number, bc: number) => Math.round(fc * alpha + bc * (1 - alpha))
        return '#' + [mix(fr, br), mix(fg, bg), mix(fb, bb)].map(x => x.toString(16).padStart(2, '0')).join('')
    }

    const css = readFileSync(join(__dirname, '../../styles/globals.css'), 'utf-8')

    function extractThemeBlock(theme: 'light' | 'dark'): string {
        if (theme === 'light') {
            // O fim é o PRIMEIRO @media DEPOIS do :root, não o primeiro do arquivo:
            // a migração para o Tailwind 4 moveu um @media para antes do :root e o
            // recorte saía vazio ("--home-cat-* não encontrada").
            const start = css.indexOf(':root {')
            return css.slice(start, css.indexOf('@media (min-width: 1024px)', start))
        }
        const start = css.indexOf('.dark {')
        return css.slice(start, css.indexOf('\n  }\n}', start))
    }

    function extractVar(block: string, name: string): string {
        const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
        if (!match) throw new Error(`--${name} não encontrada`)
        return match[1]
    }

    const CATEGORIES = ['k-drama', 'k-pop', 'k-film', 'cultura', 'grupos', 'k-beauty', 'artistas', 'noticias-k-pop', 'reality-shows', 'webtoons']

    it.each(CATEGORIES)('%s no tema claro passa 4.5:1 contra o próprio bg translúcido', slug => {
        const block = extractThemeBlock('light')
        const color = extractVar(block, `home-cat-${slug}`)
        const bg = extractVar(block, 'color-bg')
        expect(contrast(color, blend(color, 0.125, bg))).toBeGreaterThanOrEqual(4.5)
    })

    it.each(CATEGORIES)('%s no tema escuro passa 4.5:1 contra o próprio bg translúcido', slug => {
        const block = extractThemeBlock('dark')
        const color = extractVar(block, `home-cat-${slug}`)
        const bg = extractVar(block, 'color-bg')
        expect(contrast(color, blend(color, 0.125, bg))).toBeGreaterThanOrEqual(4.5)
    })
})

describe('nameToGradient', () => {
    it('é determinístico pro mesmo nome', () => {
        expect(nameToGradient('BTS')).toBe(nameToGradient('BTS'))
    })

    it('gera gradientes diferentes pra nomes diferentes', () => {
        expect(nameToGradient('BTS')).not.toBe(nameToGradient('BLACKPINK'))
    })

    it('retorna uma string de linear-gradient válida', () => {
        expect(nameToGradient('aespa')).toMatch(/^linear-gradient\(135deg, hsl\(\d+,55%,16%\) 0%, hsl\(\d+,45%,10%\) 100%\)$/)
    })
})

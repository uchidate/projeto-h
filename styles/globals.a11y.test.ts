import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Mesma fórmula de contraste WCAG 2.1 usada pelo axe-core. */
function luminance(hex: string): number {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(hex1: string, hex2: string): number {
    const l1 = luminance(hex1)
    const l2 = luminance(hex2)
    const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (a + 0.05) / (b + 0.05)
}

// Regressão do fix de 2026-07-06: --color-accent (usado em dezenas de
// componentes com bg-accent + text-white) não passa 4.5:1 em nenhum dos dois
// temas — por isso o token separado --color-accent-a11y, migrado
// especificamente pra usos de texto branco sobre fundo colorido. Se alguém
// trocar o valor de --color-accent-a11y sem checar contraste, esse teste
// deve travar antes do axe-core no CI.
const CSS_PATH = join(__dirname, 'globals.css')

function extractVar(css: string, name: string, occurrence: 0 | 1): string {
    const matches = [...css.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`, 'g'))]
    const match = matches[occurrence]
    if (!match) throw new Error(`Variável --${name} (ocorrência ${occurrence}) não encontrada em globals.css`)
    return match[1]
}

describe('--color-accent-a11y — contraste com texto branco (WCAG AA)', () => {
    const css = readFileSync(CSS_PATH, 'utf-8')

    it('tema claro passa 4.5:1', () => {
        const accentA11yLight = extractVar(css, 'color-accent-a11y', 0)
        expect(contrast('#ffffff', accentA11yLight)).toBeGreaterThanOrEqual(4.5)
    })

    it('tema escuro passa 4.5:1', () => {
        const accentA11yDark = extractVar(css, 'color-accent-a11y', 1)
        expect(contrast('#ffffff', accentA11yDark)).toBeGreaterThanOrEqual(4.5)
    })

    it('--color-accent (marca original) NÃO passa — documenta por que accent-a11y existe', () => {
        const accentLight = extractVar(css, 'color-accent', 0)
        expect(contrast('#ffffff', accentLight)).toBeLessThan(4.5)
    })
})

describe('tokens de usabilidade para páginas de entidade', () => {
    const css = readFileSync(CSS_PATH, 'utf-8')

    it('mantém alvo mínimo de toque em 44px', () => {
        expect(css).toMatch(/--tap-target-min:\s*2\.75rem;/)
        // `.classe {` no Tailwind 3; `@utility classe {` desde a migração para o 4.
        expect(css).toMatch(/(?:\.|@utility\s+)touch-target\s*{[\s\S]*?min-height:\s*var\(--tap-target-min\)/)
    })

    it('mantém uma medida explícita para leitura editorial', () => {
        expect(css).toMatch(/--content-measure:\s*68ch;/)
        expect(css).toMatch(/(?:\.|@utility\s+)profile-prose\s*{[\s\S]*?max-width:\s*var\(--content-measure\)/)
    })
})

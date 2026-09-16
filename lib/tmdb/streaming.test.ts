import { describe, it, expect } from 'vitest'
import { STREAMING_PLATFORMS, PLATFORM_ORDER } from './streaming'

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

// Regressão do fix de 2026-07-06: netflix/disney/prime/apple falhavam contraste
// em pelo menos um dos dois usos (badge sólido c/ texto branco, ou texto sobre
// fundo escuro translúcido em components/home/HomeStreamingTop.tsx). Uma única
// hex não atendia os dois casos ao mesmo tempo — por isso os dois campos.
const DARK_BADGE_BG = '#210b0f'

describe('STREAMING_PLATFORMS — contraste WCAG AA (4.5:1)', () => {
    for (const [key, cfg] of Object.entries(STREAMING_PLATFORMS)) {
        it(`${key}: hex (fundo sólido) passa com texto branco`, () => {
            expect(contrast('#ffffff', cfg.hex)).toBeGreaterThanOrEqual(4.5)
        })

        it(`${key}: textHex (texto sobre fundo escuro translúcido) passa contra ${DARK_BADGE_BG}`, () => {
            expect(contrast(cfg.textHex, DARK_BADGE_BG)).toBeGreaterThanOrEqual(4.5)
        })
    }
})

describe('PLATFORM_ORDER', () => {
    it('toda entrada em PLATFORM_ORDER existe em STREAMING_PLATFORMS', () => {
        for (const key of PLATFORM_ORDER) {
            expect(STREAMING_PLATFORMS[key]).toBeDefined()
        }
    })

    it('toda entrada em STREAMING_PLATFORMS aparece em PLATFORM_ORDER', () => {
        const keys = Object.keys(STREAMING_PLATFORMS)
        expect(new Set(PLATFORM_ORDER)).toEqual(new Set(keys))
    })
})

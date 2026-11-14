import { describe, it, expect } from 'vitest'
import { pratosEmDestaque } from './pratosEmDestaque'
import type { WPFood } from '@/lib/wordpress/types'

const prato = (slug: string, score: number | undefined, extra: Partial<WPFood> = {}): WPFood => ({
    id: 1, slug, title: { rendered: slug }, featured_image_url: `/${slug}.jpg`,
    acf: { trending_score: score, curiosidades: [`Curiosidade de ${slug}. Mais texto aqui.`] },
    ...extra,
} as WPFood)

describe('pratosEmDestaque', () => {
    it('ordena por trending_score e respeita o limite', () => {
        const r = pratosEmDestaque([prato('a', 10), prato('b', 90), prato('c', 50)], 2)
        expect(r.map(p => p.slug)).toEqual(['b', 'c'])
    })
    it('ignora prato sem foto ou sem pontuação', () => {
        const r = pratosEmDestaque([prato('a', 90, { featured_image_url: null }), prato('b', undefined), prato('c', 5)])
        expect(r.map(p => p.slug)).toEqual(['c'])
    })
    it('usa a primeira curiosidade como gancho e encurta o texto longo no fim de frase', () => {
        const longa = `${'Frase curta e completa. '.repeat(3)}${'palavra '.repeat(60)}`
        const r = pratosEmDestaque([prato('a', 90, { acf: { trending_score: 90, curiosidades: [longa] } } as Partial<WPFood>)])
        expect(r[0].gancho!.length).toBeLessThanOrEqual(222)
        expect(r[0].gancho!.startsWith('Frase curta')).toBe(true)
    })
})

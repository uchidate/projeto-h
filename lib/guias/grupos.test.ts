import { describe, expect, it } from 'vitest'
import { ALL_HUBS, GRUPOS_DE_GUIAS } from '@/lib/guias'

describe('GRUPOS_DE_GUIAS', () => {
    it('cobre cada guia estático exatamente uma vez, no kind certo', () => {
        const vistos = new Map<string, string>()
        for (const { kind, grupos } of GRUPOS_DE_GUIAS) {
            for (const g of grupos) {
                for (const hub of g.hubs) {
                    expect(hub.kind, `${hub.slug} em ${kind}`).toBe(kind)
                    expect(vistos.has(hub.slug), `${hub.slug} repetido`).toBe(false)
                    vistos.set(hub.slug, g.titulo)
                }
            }
        }
        expect([...vistos.keys()].sort()).toEqual(ALL_HUBS.map(h => h.slug).sort())
    })
})

describe('getRelatedHubs', () => {
    it('guia de agência sugere primeiro as outras agências', async () => {
        const { getRelatedHubs, HUB_BY_SLUG } = await import('./index')
        const jyp = HUB_BY_SLUG['artistas-jyp-entertainment']
        const rel = await getRelatedHubs(jyp, 6)
        expect(rel.length).toBeGreaterThan(0)
        expect(rel.every(h => /^artistas-/.test(h.slug) && h.slug !== jyp.slug)).toBe(true)
        expect(rel.some(h => h.slug === 'artistas-sm-entertainment' || /sm/.test(h.slug))).toBe(true)
    })
})

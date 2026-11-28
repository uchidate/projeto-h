import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/wordpress/guias', () => ({ getGuias: async () => [] }))

import { ALL_HUBS, GRUPOS_DE_GUIAS, getRelatedHubs, rotuloDoGuia } from './index'

const repetidos = (lista: string[]) => lista.filter((v, i) => lista.indexOf(v) !== i)
const agrupados = GRUPOS_DE_GUIAS.flatMap(({ kind, grupos }) => grupos.flatMap(g => g.hubs.map(h => ({ kind, grupo: g.id, hub: h }))))

describe('definições dos guias', () => {
    it('cada slug é único e serve de URL', () => {
        const slugs = ALL_HUBS.map(h => h.slug)
        expect(repetidos(slugs)).toEqual([])
        expect(slugs.filter(s => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))).toEqual([])
    })

    // Dois guias iguais disputam a mesma busca no Google.
    it('nenhum par de guias tem o mesmo título ou a mesma lista', () => {
        expect(repetidos(ALL_HUBS.map(h => h.title))).toEqual([])
        const listas = ALL_HUBS.filter(h => Object.keys(h.filter).length > 0)
            .map(h => `${h.kind} ${JSON.stringify(Object.entries(h.filter).sort())}`)
        expect(repetidos(listas)).toEqual([])
    })

    it('todo guia tem o texto mínimo', () => {
        const falhos = ALL_HUBS.filter(h =>
            [h.title, h.shortTitle, h.description, ...h.intro].some(t => !t?.trim())
            || h.intro.length === 0
            || h.faq.some(f => !f.question.trim() || !f.answer.trim()),
        ).map(h => h.slug)
        expect(falhos).toEqual([])
    })

    it('só o guia de melhores de todos os tempos lista sem filtro', () => {
        const semFiltro = ALL_HUBS.filter(h => Object.values(h.filter).every(v => v === undefined || v === '')).map(h => h.slug)
        expect(semFiltro).toEqual(['melhores-doramas-de-todos-os-tempos'])
    })

    it('cada guia aparece uma vez no índice /guias, no tipo certo', () => {
        expect(repetidos(agrupados.map(a => a.hub.slug))).toEqual([])
        expect(agrupados.map(a => a.hub.slug).sort()).toEqual(ALL_HUBS.map(h => h.slug).sort())
        expect(agrupados.filter(a => a.hub.kind !== a.kind).map(a => a.hub.slug)).toEqual([])
        expect(ALL_HUBS.filter(h => !rotuloDoGuia(h.slug))).toEqual([])
        expect(rotuloDoGuia('nao-existe')).toBeUndefined()
    })

    it('buscas relacionadas são links do próprio site, e os de guia existem', () => {
        const slugs = new Set(ALL_HUBS.map(h => h.slug))
        const links = ALL_HUBS.flatMap(h => (h.relatedSearches ?? []).map(r => ({ de: h.slug, ...r })))
        expect(links.filter(l => !l.label.trim() || !l.href.startsWith('/'))).toEqual([])
        expect(links.filter(l => {
            const guia = l.href.match(/^\/guias\/([^/?#]+)/)?.[1]
            return guia !== undefined && !slugs.has(guia)
        })).toEqual([])
    })

    it('intervalo de estreia não vem invertido', () => {
        expect(ALL_HUBS.filter(h => (h.filter.debutYearMin ?? 0) > (h.filter.debutYearMax ?? Infinity)).map(h => h.slug)).toEqual([])
    })

    it('os relacionados começam pelos irmãos da mesma lista', async () => {
        const lista = GRUPOS_DE_GUIAS.flatMap(k => k.grupos).find(g => g.id === 'network')!.hubs
        const relacionados = await getRelatedHubs(lista[0], lista.length)
        expect(relacionados.slice(0, lista.length - 1).map(h => h.slug)).toEqual(lista.slice(1).map(h => h.slug))
    })
})

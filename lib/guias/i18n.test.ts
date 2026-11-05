import { describe, expect, it } from 'vitest'
import { ALL_HUBS as STATIC_HUBS_PARA_TESTE } from './index'
import { localizarGuia, slugPtDoGuia, slugPublicoDoGuia, slugsPtTraduzidos, traducoesDoIdioma } from './i18n'

describe('guias traduzidos', () => {
    const traduzidos = slugsPtTraduzidos('en')

    it('todo guia traduzido existe no catálogo e é de produções (a grade só sabe listar produções traduzidas)', () => {
        for (const slug of traduzidos) {
            const hub = STATIC_HUBS_PARA_TESTE.find((h) => h.slug === slug)
            expect(hub, slug).toBeDefined()
            expect(hub!.kind, slug).toBe('productions')
        }
    })

    it('slug público é único e vai e volta', () => {
        const publicos = traduzidos.map((s) => slugPublicoDoGuia(s, 'en'))
        expect(new Set(publicos).size).toBe(traduzidos.length)
        for (const slug of traduzidos) expect(slugPtDoGuia(slugPublicoDoGuia(slug, 'en')!, 'en')).toBe(slug)
        expect(slugPublicoDoGuia('x', 'pt')).toBe('x')
    })

    it('guia relacionado aponta para outro guia traduzido', () => {
        for (const [slug, tr] of Object.entries(traducoesDoIdioma('en'))) {
            for (const r of tr.relatedSearches ?? []) {
                expect(traduzidos, `${slug} → ${r.to}`).toContain(r.to)
                expect(r.to).not.toBe(slug)
            }
        }
    })

    it('guia sem tradução devolve null; com tradução troca o texto e mantém o filtro', () => {
        const hub = STATIC_HUBS_PARA_TESTE.find((h) => h.slug === 'doramas-romanticos')!
        const en = localizarGuia(hub, 'en')!
        expect(en.title).toBe('Korean Romance Dramas')
        expect(en.filter).toEqual(hub.filter)
        expect(localizarGuia(STATIC_HUBS_PARA_TESTE.find((h) => h.slug === 'doramas-tvn')!, 'en')).toBeNull()
    })
})

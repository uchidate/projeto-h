import { describe, expect, it } from 'vitest'
import { ALL_HUBS as STATIC_HUBS_PARA_TESTE } from './index'
import { localizarGuia, slugPtDoGuia, slugPublicoDoGuia, slugsPtTraduzidos, traducoesDoIdioma } from './i18n'

describe('guias traduzidos', () => {
    const traduzidos = slugsPtTraduzidos('en')

    it('todo guia traduzido existe no catálogo', () => {
        for (const slug of traduzidos) {
            const hub = STATIC_HUBS_PARA_TESTE.find((h) => h.slug === slug)
            expect(hub, slug).toBeDefined()
        }
    })

    it('todo guia do catálogo tem tradução em inglês', () => {
        expect(STATIC_HUBS_PARA_TESTE.filter((h) => !traduzidos.includes(h.slug)).map((h) => h.slug)).toEqual([])
    })

    it('todo guia do catálogo tem tradução em japonês, sem português sobrando', () => {
        const ja = traducoesDoIdioma('ja')
        expect(STATIC_HUBS_PARA_TESTE.filter((h) => !ja[h.slug]).map((h) => h.slug)).toEqual([])
        for (const [slug, t] of Object.entries(ja)) {
            const texto = [t.title, t.shortTitle, t.description, ...t.intro, t.whatYouWillFind ?? '', ...t.faq.flatMap((f) => [f.question, f.answer]), ...(t.relatedSearches ?? []).map((r) => r.label)].join(' ')
            expect(texto, slug).not.toMatch(/[ãõçáéíóúê]|\b(de|do|da|dos|das|com|para|que|uma)\b/i)
            expect(t.faq.length, slug).toBeGreaterThan(0)
        }
        const slugs = Object.values(ja).map((t) => t.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
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
        expect(localizarGuia({ ...hub, slug: 'guia-sem-traducao' }, 'en')).toBeNull()
    })
})

describe('localizarGuia com tradução do WordPress', () => {
    const slug = slugsPtTraduzidos('en')[0]
    const hub = STATIC_HUBS_PARA_TESTE.find((h) => h.slug === slug)!
    const json = traducoesDoIdioma('en')[slug]

    it('sem tradução no WordPress, usa o JSON', () => {
        expect(localizarGuia(hub, 'en')?.title).toBe(json.title)
    })

    it('tradução publicada do WordPress vale por cima do JSON, campo a campo', () => {
        const out = localizarGuia({ ...hub, traducoes: { en: { title: 'WP title', acf: { intro: ['WP intro'], faq: [{ question: 'Q?', answer: 'A.' }] }, seo_title: 'SEO EN' } } }, 'en')!
        expect(out.title).toBe('WP title')
        expect(out.intro).toEqual(['WP intro'])
        expect(out.faq).toEqual([{ question: 'Q?', answer: 'A.' }])
        expect(out.seoTitle).toBe('SEO EN')
        expect(out.description).toBe(json.description)
        expect(out.traducoes).toBeUndefined()
    })

    it('tradução velha (stale) é ignorada', () => {
        const out = localizarGuia({ ...hub, traducoes: { en: { title: 'Velho', stale: true } } }, 'en')!
        expect(out.title).toBe(json.title)
    })

    it('guia sem entrada no JSON do idioma não existe, mesmo com tradução no WordPress', () => {
        expect(localizarGuia({ ...hub, slug: 'nao-existe', traducoes: { en: { title: 'X' } } }, 'en')).toBeNull()
    })

    it('o SEO em português não vaza para o idioma', () => {
        expect(localizarGuia({ ...hub, seoTitle: 'Título PT' }, 'en')?.seoTitle).toBeUndefined()
    })
})

import { describe, expect, it } from 'vitest'
import type { ArchiveHub, TraducaoWPDoGuia } from './types'
import { montarMapaDeGuias } from './i18n'

const tr = (slug: string, extra: Partial<TraducaoWPDoGuia> = {}): TraducaoWPDoGuia => ({
    slug, title: `T ${slug}`, excerpt: `D ${slug}`, seo_title: `SEO ${slug}`,
    acf: { short_title: `S ${slug}`, intro: ['I1', ''], what_you_will_find: 'W', faq: [{ question: 'Q', answer: 'A' }, { question: 'Q2' }] },
    ...extra,
})
const hub = (slug: string, traducoes: ArchiveHub['traducoes'], relatedSearches?: ArchiveHub['relatedSearches']): ArchiveHub => ({
    slug, kind: 'productions', title: `pt ${slug}`, shortTitle: `pt-s ${slug}`, description: 'pt d', intro: ['pt'], keywords: ['pt'],
    faq: [], filter: { genre: slug }, seoTitle: 'pt seo', traducoes, relatedSearches,
})

const mapa = montarMapaDeGuias([
    hub('romance', { en: tr('romance-dramas'), ja: tr('ja-romance', { stale: true }) }, [
        { label: 'Comédia', href: '/guias/comedia' }, { label: 'Ação', href: '/guias/acao' }, { label: 'Fora', href: '/blog/x' },
    ]),
    hub('comedia', { en: tr('comedy-dramas') }),
    hub('acao', { en: { title: 'sem slug' } }),
])

describe('mapa dos guias por idioma', () => {
    it('slug do idioma nos dois sentidos; em português, o próprio', () => {
        expect(mapa.slugPublico('romance', 'en')).toBe('romance-dramas')
        expect(mapa.slugPt('romance-dramas', 'en')).toBe('romance')
        expect(mapa.slugPublico('romance', 'pt')).toBe('romance')
        expect(mapa.slugPublico('acao', 'en')).toBeUndefined()
        expect(mapa.slugPt('nao-existe', 'en')).toBeUndefined()
    })

    it('desatualizada mantém a URL, mas fica fora dos traduzidos e do hreflang', () => {
        expect(mapa.slugPt('ja-romance', 'ja')).toBe('romance')
        expect(mapa.traduzidos('ja')).toEqual([])
        expect(mapa.traduzidos('en')).toEqual(['romance', 'comedia'])
        expect(Object.keys(mapa.alternativas('romance') ?? {})).not.toContain('ja')
        expect(mapa.alternativas('acao')).toBeUndefined()
    })

    it('localizar: texto e SEO do idioma, listas limpas, sem palavras-chave em português', () => {
        const g = mapa.localizar(mapa.hubs[0], 'en')!
        expect(g).toMatchObject({ slug: 'romance', title: 'T romance-dramas', shortTitle: 'S romance-dramas', description: 'D romance-dramas', intro: ['I1'], whatYouWillFind: 'W', seoTitle: 'SEO romance-dramas', keywords: [] })
        expect(g.faq).toEqual([{ question: 'Q', answer: 'A' }])
        expect(g.filter).toEqual({ genre: 'romance' })
        expect(g.desatualizado).toBeUndefined()
    })

    it('buscas relacionadas: as do português, só destino em dia, com o título curto traduzido e a URL do idioma', () => {
        expect(mapa.localizar(mapa.hubs[0], 'en')!.relatedSearches).toEqual([{ label: 'S comedy-dramas', href: '/en/guides/comedy-dramas' }])
    })

    it('desatualizada mostra o português marcado; sem tradução, null', () => {
        const g = mapa.localizar(mapa.hubs[0], 'ja')!
        expect(g.desatualizado).toBe(true)
        expect(g.title).toBe('pt romance')
        expect(g.seoTitle).toBeUndefined()
        expect(mapa.localizar(mapa.hubs[2], 'en')).toBeNull()
        expect(mapa.localizar(mapa.hubs[0], 'pt')).toBe(mapa.hubs[0])
    })
})

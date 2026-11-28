// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

const m = vi.hoisted(() => ({ mapa: vi.fn(), itens: vi.fn() }))

vi.mock('@/lib/guias/i18n', () => ({ getMapaDeGuias: m.mapa }))
vi.mock('@/lib/guias/hub-items', () => ({ getHubItems: m.itens }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    hasLocale: (p: { traduzida: boolean }) => p.traduzida,
    localizeEntity: (p: object) => p,
}))
vi.mock('@/components/features/LocalizedCatalog', () => ({ EntityGrid: ({ items }: { items: unknown[] }) => <div data-testid="grade">{items.length}</div> }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404') } }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string, v?: object) => (v ? `${k} ${JSON.stringify(v)}` : k) }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import { LocalizedGuide, buildLocalizedGuideMetadata, buildLocalizedGuidesIndexMetadata } from './LocalizedGuide'

const hub = (extra: Record<string, unknown> = {}) => ({ slug: 'guia-pt', title: 'Guide', description: 'Desc', intro: ['P1'], faq: [], ...extra })
const mapa = (extra: Record<string, unknown> = {}) => ({
    hubs: [{ slug: 'guia-pt' }],
    slugPt: (s: string) => (s === 'guide' ? 'guia-pt' : null),
    localizar: () => hub(),
    alternativas: () => null,
    alternativasDoIndice: () => null,
    traduzidos: () => [],
    ...extra,
})
const pagina = async () => render(await LocalizedGuide({ slugPublico: 'guide', locale: 'en' }) as ReactElement)

beforeEach(() => {
    m.mapa.mockReset().mockResolvedValue(mapa())
    m.itens.mockReset().mockResolvedValue({ kind: 'productions', total: 1, items: [{ traduzida: true }] })
})
afterEach(cleanup)

describe('buildLocalizedGuideMetadata', () => {
    it('vazia para slug sem guia ou sem tradução', async () => {
        expect(await buildLocalizedGuideMetadata('outro', 'en')).toEqual({})
        m.mapa.mockResolvedValue(mapa({ localizar: () => undefined }))
        expect(await buildLocalizedGuideMetadata('guide', 'en')).toEqual({})
    })

    it('monta os pares de idioma quando o mapa não traz alternativas', async () => {
        const meta = await buildLocalizedGuideMetadata('guide', 'en')
        expect(meta.title).toBe('Guide')
        const idiomas = meta.alternates?.languages as Record<string, string>
        expect(idiomas['x-default']).toMatch(/\/guias\/guia-pt$/)
        expect(Object.keys(idiomas)).toHaveLength(3)
        expect(meta.robots).toEqual({ index: true, follow: true })
    })

    it('usa o SEO próprio e tira do índice a tradução desatualizada', async () => {
        m.mapa.mockResolvedValue(mapa({ localizar: () => hub({ seoTitle: 'T', seoDescription: 'D', desatualizado: true }), alternativas: () => ({ en: 'u' }) }))
        const meta = await buildLocalizedGuideMetadata('guide', 'en')
        expect(meta).toMatchObject({ title: 'T', description: 'D', robots: { index: false, follow: true } })
        expect(meta.alternates?.languages).toEqual({ en: 'u' })
    })

    it('guia sem ficha traduzida não é indexado', async () => {
        m.itens.mockResolvedValue({ kind: 'productions', total: 4, items: [{ traduzida: false }] })
        expect((await buildLocalizedGuideMetadata('guide', 'en')).robots).toEqual({ index: false, follow: true })
    })
})

describe('LocalizedGuide', () => {
    it('responde 404 para slug desconhecido', async () => {
        await expect(LocalizedGuide({ slugPublico: 'outro', locale: 'en' })).rejects.toThrow('404')
    })

    it('mostra texto, grade, perguntas e buscas relacionadas', async () => {
        m.mapa.mockResolvedValue(mapa({ localizar: () => hub({ whatYouWillFind: 'Você acha', faq: [{ question: 'Q?', answer: 'A.' }], relatedSearches: [{ href: '/x', label: 'X' }] }) }))
        await pagina()
        expect(m.itens).toHaveBeenCalledWith(expect.anything(), { locale: 'en', perPage: 48 })
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Guide')
        expect(screen.getByTestId('grade').textContent).toBe('1')
        expect(screen.getByText('productions {"count":1}')).toBeTruthy()
        expect(screen.getByText('Você acha')).toBeTruthy()
        expect(screen.getByText('Q?')).toBeTruthy()
        expect(screen.getByRole('link', { name: 'X' }).getAttribute('href')).toMatch(/\/x$/)
        expect(screen.queryByText(/seeAll/)).toBeNull()
    })

    it.each([
        ['artists', 'emptyArtists', 'seeAllArtists'],
        ['groups', 'emptyGroups', 'seeAllGroups'],
        ['productions', 'empty', 'seeAll'],
    ])('sem tradução em %s avisa e aponta para a listagem', async (kind, vazio, todos) => {
        m.itens.mockResolvedValue({ kind, total: 9, items: [] })
        await pagina()
        expect(screen.getByText(vazio)).toBeTruthy()
        expect(screen.getByRole('link', { name: `${todos} →` })).toBeTruthy()
        expect(screen.queryByTestId('grade')).toBeNull()
    })
})

describe('buildLocalizedGuidesIndexMetadata', () => {
    it('sem guia traduzido fica fora do índice', async () => {
        const meta = await buildLocalizedGuidesIndexMetadata('en')
        expect(meta.robots).toEqual({ index: false, follow: true })
        expect((meta.alternates?.languages as Record<string, string>)['x-default']).toMatch(/\/guias$/)
    })

    it('com guias traduzidos entra no índice e usa as alternativas do mapa', async () => {
        m.mapa.mockResolvedValue(mapa({ traduzidos: () => ['guide'], alternativasDoIndice: () => ({ en: 'u' }) }))
        const meta = await buildLocalizedGuidesIndexMetadata('en')
        expect(meta.robots).toEqual({ index: true, follow: true })
        expect(meta.alternates?.languages).toEqual({ en: 'u' })
    })
})

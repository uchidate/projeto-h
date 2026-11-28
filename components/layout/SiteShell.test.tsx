import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement, ReactNode } from 'react'

// Casco do site: o que menu e rodapé recebem no português e nos outros idiomas.
// Nada é renderizado; o teste procura os elementos na árvore devolvida.
const m = vi.hoisted(() => ({
    getMonetizationSettings: vi.fn(),
    getSiteSettings: vi.fn(),
    getMapaDeGuias: vi.fn(),
}))

vi.mock('next/font/google', () => {
    const fonte = () => ({ variable: 'f' })
    return { Outfit: fonte, Inter: fonte, Sora: fonte, Playfair_Display: fonte }
})
vi.mock('@/styles/globals.css', () => ({}))
vi.mock('@/lib/wordpress/monetization', () => ({ getMonetizationSettings: m.getMonetizationSettings }))
vi.mock('@/lib/wordpress/site-settings', () => ({ getSiteSettings: m.getSiteSettings }))
vi.mock('@/lib/guias/i18n', () => ({ getMapaDeGuias: m.getMapaDeGuias }))
vi.mock('@/components/NavBar', () => ({ default: () => null }))
vi.mock('@/components/ui/Footer', () => ({ default: () => null }))

import NavBar from '@/components/NavBar'
import Footer from '@/components/ui/Footer'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { SiteShell } from './SiteShell'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = ReactElement<any>

function elementos(no: ReactNode): El[] {
    if (Array.isArray(no)) return no.flatMap(elementos)
    if (!no || typeof no !== 'object' || !('props' in no)) return []
    const el = no as El
    return [el, ...elementos(el.props.children)]
}

async function abrir(locale: Locale = DEFAULT_LOCALE) {
    const todos = elementos(await SiteShell({ locale, children: 'conteúdo' }))
    return {
        html: todos[0].props,
        nav: todos.find(e => e.type === NavBar)!.props,
        rodape: todos.find(e => e.type === Footer)!.props,
        preconnects: todos.filter(e => e.type === 'link' && e.props.rel === 'preconnect'),
    }
}

const ajustes = (links: { label: string; href: string }[] = [{ label: 'Artistas', href: '/artists' }]) => ({
    navigation: [{ label: 'Menu do WP', href: '/wp' }],
    tagline: 'Assinatura do WP',
    logoSubtitles: ['Subtítulo do WP'],
    footerColumns: [{ title: 'Catálogo', links }, { title: 'Outra', links: [] }],
    maisBuscados: [{ label: 'BTS', href: '/groups/bts' }],
    googleTag: '',
})

beforeEach(() => {
    vi.clearAllMocks()
    m.getMonetizationSettings.mockResolvedValue({ enabled: false })
    m.getSiteSettings.mockResolvedValue(ajustes())
    m.getMapaDeGuias.mockResolvedValue(null)
})

describe('SiteShell em português', () => {
    it('usa menu, assinatura e mais buscados do WordPress', async () => {
        const { nav, rodape } = await abrir()
        expect(nav.navLinks).toEqual([{ label: 'Menu do WP', href: '/wp' }])
        expect(nav.logoSubtitles).toEqual(['Subtítulo do WP'])
        expect(rodape.tagline).toBe('Assinatura do WP')
        expect(rodape.labels.homeHref).toBe('/')
        expect(rodape.mostSearched).toHaveLength(1)
        expect(m.getMapaDeGuias).not.toHaveBeenCalled()
    })

    it('acrescenta a loja no fim da primeira coluna do rodapé, só nela', async () => {
        const { rodape } = await abrir()
        expect(rodape.columns[0].links.at(-1)).toEqual({ label: 'Loja', href: '/loja' })
        expect(rodape.columns[1].links).toEqual([])
    })

    it('não repete a loja quando o WordPress já a lista', async () => {
        m.getSiteSettings.mockResolvedValue(ajustes([{ label: 'Lojinha', href: '/loja?g=1' }]))
        expect((await abrir()).rodape.columns[0].links).toHaveLength(1)
    })

    it('só antecipa a conexão com anúncios quando a monetização está ligada', async () => {
        expect((await abrir()).preconnects).toHaveLength(0)
        m.getMonetizationSettings.mockResolvedValue({ enabled: true })
        expect((await abrir()).preconnects.length).toBeGreaterThan(0)
    })
})

describe('SiteShell em outro idioma', () => {
    it('não leva textos nem links só do português', async () => {
        const { html, nav, rodape } = await abrir('en' as Locale)
        expect(html.lang).toMatch(/^en/)
        expect(nav.navLinks).not.toContainEqual({ label: 'Menu do WP', href: '/wp' })
        expect(rodape.tagline).not.toBe('Assinatura do WP')
        expect(rodape.labels.homeHref).toBe('/en')
        expect(rodape.labels.mostSearched).toBeUndefined()
        expect(rodape.mostSearched).toEqual([])
        const links = rodape.columns.flatMap((c: { links: { href: string }[] }) => c.links)
        expect(links.some((l: { href: string }) => l.href.startsWith('/loja'))).toBe(false)
    })

    it('mostra no rodapé até 6 guias traduzidos, pulando o que não existe', async () => {
        const hubs = Array.from({ length: 8 }, (_, i) => ({ slug: `guia-${i}` }))
        m.getMapaDeGuias.mockResolvedValue({
            hubs,
            traduzidos: () => ['sumido', ...hubs.map(h => h.slug)],
            localizar: (hub: { slug: string }) => ({ shortTitle: `Título ${hub.slug}` }),
            slugPublico: (slug: string) => `${slug}-en`,
        })
        const { rodape } = await abrir('en' as Locale)
        const titulos = rodape.columns.flatMap((c: { links: { label: string }[] }) => c.links)
            .map((l: { label: string }) => l.label).filter((l: string) => l.startsWith('Título'))
        expect(titulos).toEqual([0, 1, 2, 3, 4].map(i => `Título guia-${i}`))
    })
})

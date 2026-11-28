import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Children, type ReactElement } from 'react'

const m = vi.hoisted(() => ({ catalogo: vi.fn(), carregar: vi.fn(), idiomas: vi.fn() }))

vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/components/features/LocalizedCatalog', () => ({ fetchCatalog: m.catalogo }))
vi.mock('@/lib/home/carregar-home', () => ({ carregarHome: m.carregar }))
vi.mock('@/lib/i18n/alternates', () => ({
    idiomasComConteudo: m.idiomas,
    hreflangDe: (ls: string[], url: (l: string) => string) => Object.fromEntries(ls.map(l => [l, url(l)])),
}))
vi.mock('@/lib/wordpress/config', () => ({ IS_BUILD: false }))
vi.mock('@/components/home/HomeFrontPage', () => ({ HomeFrontPage: () => null }))
vi.mock('@/components/quiz/PerguntaDoDiaServer', () => ({ PerguntaDoDiaServer: () => null }))

import { HomeIntl, generateMetadataHomeIntl } from './HomeIntl'
import { HomeFrontPage } from './HomeFrontPage'

const dados = (posts: number, producoes = 1) => ({
    posts: Array(posts).fill({}), productions: Array(producoes).fill({}), artists: [], siteSettings: { home: {} },
    featuredSpotlight: null,
})
const frente = async () => {
    const el = await HomeIntl({ locale: 'en' }) as ReactElement<{ children: ReactElement }>
    const filho = Children.only(el.props.children) as ReactElement<Record<string, unknown>>
    expect(filho.type).toBe(HomeFrontPage)
    return filho.props
}

beforeEach(() => {
    m.catalogo.mockReset().mockResolvedValue({ total: 0 })
    m.idiomas.mockReset().mockResolvedValue([])
    m.carregar.mockReset()
})

describe('generateMetadataHomeIntl', () => {
    it('idioma sem nenhuma ficha fica fora do índice e sem hreflang', async () => {
        const meta = await generateMetadataHomeIntl('en')
        expect(meta.robots).toEqual({ index: false, follow: true })
        expect(meta.alternates).not.toHaveProperty('languages')
    })

    it('com conteúdo aponta o português, o próprio idioma e os demais preenchidos', async () => {
        m.catalogo.mockResolvedValue({ total: 3 })
        m.idiomas.mockImplementation(async (outras: string[], tem: (l: string) => Promise<boolean>) => (await tem(outras[0])) ? [outras[0]] : [])
        const meta = await generateMetadataHomeIntl('en')
        expect(meta.robots).toBeUndefined()
        const idiomas = meta.alternates?.languages as Record<string, string>
        expect(idiomas.pt).toMatch(/\/$/)
        expect(idiomas.en).toMatch(/\/en$/)
        expect(Object.keys(idiomas).length).toBeGreaterThanOrEqual(3)
    })
})

describe('HomeIntl', () => {
    it('não deixa cachear a home sem produções', async () => {
        m.carregar.mockResolvedValue(dados(5, 0))
        await expect(HomeIntl({ locale: 'en' })).rejects.toThrow('WordPress indisponível')
    })

    it.each([[2, 0], [3, 3]])('com %i artigos traduzidos entrega %i', async (ha, entrega) => {
        m.carregar.mockResolvedValue(dados(ha))
        const props = await frente()
        expect(m.carregar).toHaveBeenCalledWith({ comercio: false, locale: 'en' })
        expect(props.posts).toHaveLength(entrega)
        expect(props).toMatchObject({ locale: 'en', featuredArtist: null, featuredArtistNote: '' })
    })
})

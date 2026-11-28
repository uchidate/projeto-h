import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

// O que a rota da ficha de grupo busca e entrega à página: 404, idioma, solos, discografia e loja.
// A página em si não é renderizada; o teste lê as props do elemento devolvido.
const m = vi.hoisted(() => ({
    getGroupBySlug: vi.fn(),
    getRelatedGroups: vi.fn(),
    getArtistsByIds: vi.fn(),
    getPosts: vi.fn(),
    getAgencies: vi.fn(),
    getMusicReleases: vi.fn(),
    getStoreProductsByGroupId: vi.fn(),
    ordenarPrateleira: vi.fn(),
    comDescobertas: vi.fn(),
    getVitrineGeral: vi.fn(),
    getMencoesNoAcervo: vi.fn(),
    resolveEntityOrganizationContext: vi.fn(),
    getArtigosDeAlbum: vi.fn(),
    ligarArtigosAosAlbuns: vi.fn(),
    buildLanguageLinks: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/lib/wordpress/groups', () => ({ getGroupBySlug: m.getGroupBySlug, getRelatedGroups: m.getRelatedGroups }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (chave: string) => chave }))
vi.mock('next/navigation', () => ({ notFound: m.notFound }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: m.getArtistsByIds }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.getPosts }))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencies: m.getAgencies }))
vi.mock('@/lib/wordpress/music', () => ({ getMusicReleases: m.getMusicReleases }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByGroupId: m.getStoreProductsByGroupId }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: m.ordenarPrateleira }))
vi.mock('@/lib/wordpress/vitrine', () => ({ comDescobertas: m.comDescobertas, getVitrineGeral: m.getVitrineGeral }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: m.getMencoesNoAcervo }))
vi.mock('@/lib/agencies/preview', () => ({
    applyAgencyDirectoryManifestPreview: async (a: unknown) => a,
    applyGroupManifestPreview: async (g: unknown) => g,
}))
vi.mock('@/lib/agencies/network', () => ({ resolveEntityOrganizationContext: m.resolveEntityOrganizationContext }))
vi.mock('@/lib/blog/albumArticles', () => ({ getArtigosDeAlbum: m.getArtigosDeAlbum, ligarArtigosAosAlbuns: m.ligarArtigosAosAlbuns }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForGroup: () => [] }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: m.buildLanguageLinks }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/groups/GroupDetailPage', () => ({ GroupDetailPage: () => null }))
vi.mock('@/components/groups/GroupDiscography', () => ({}))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/i18n/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: () => null }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))

import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { GroupDetailPage } from '@/components/groups/GroupDetailPage'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { JsonLd } from '@/components/seo/JsonLd'
import { GroupRoute } from './GroupRoute'

const PT = DEFAULT_LOCALE

function grupo(extra: Record<string, unknown> = {}) {
    return { id: 7, slug: 'aespa', title: { rendered: 'aespa' }, content: { rendered: '<p>Grupo.</p>' }, meta: {}, acf: {}, ...extra }
}

const lancamento = (id: number, release_type: string, extra: Record<string, unknown> = {}) =>
    ({ id, title: `L${id}`, release_type, release_date: '2020-11-17', cover_url: 'capa', spotify_url: 'sp', ...extra })

async function abrir(locale: Locale = PT) {
    const arvore = await GroupRoute({ slug: 'aespa', locale }) as ReactElement<{ children: unknown[] }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filhos = arvore.props.children.filter(Boolean) as ReactElement<any>[]
    const achar = (tipo: unknown) => filhos.find(f => f.type === tipo)
    return {
        pagina: achar(GroupDetailPage)!.props,
        aviso: achar(AvisoSemTraducao),
        seletor: achar(LanguageSwitcher),
        trilha: achar(JsonLd)!.props.data,
    }
}

beforeEach(() => {
    for (const fn of Object.values(m)) fn.mockReset()
    m.notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    m.getGroupBySlug.mockResolvedValue(grupo())
    m.getRelatedGroups.mockResolvedValue([])
    m.getArtistsByIds.mockResolvedValue([])
    m.getPosts.mockResolvedValue({ items: [{ id: 5 }] })
    m.getAgencies.mockResolvedValue({ items: [{ id: 8 }] })
    m.getMusicReleases.mockResolvedValue([])
    m.getStoreProductsByGroupId.mockResolvedValue([])
    m.ordenarPrateleira.mockImplementation((p: unknown[]) => p)
    m.comDescobertas.mockImplementation(async (p: unknown[]) => [...p, { id: 'descoberta' }])
    m.getVitrineGeral.mockResolvedValue([{ id: 'vitrine' }])
    m.getMencoesNoAcervo.mockResolvedValue([{ id: 'empresa' }])
    m.resolveEntityOrganizationContext.mockImplementation((_g: unknown, diretorio: unknown[]) => ({ directOrganizations: diretorio }))
    m.getArtigosDeAlbum.mockResolvedValue([])
    m.ligarArtigosAosAlbuns.mockReturnValue({})
    m.buildLanguageLinks.mockResolvedValue([])
})

describe('GroupRoute', () => {
    it('grupo inexistente vira 404 sem buscar o resto', async () => {
        m.getGroupBySlug.mockResolvedValue(null)
        await expect(GroupRoute({ slug: 'nao-existe', locale: PT })).rejects.toThrow('NEXT_NOT_FOUND')
        expect(m.getArtistsByIds).not.toHaveBeenCalled()
    })

    it('em português entrega agência, posts, empresas e a trilha de navegação', async () => {
        const { pagina, aviso, seletor, trilha } = await abrir()
        expect(aviso).toBeUndefined()
        expect(seletor).toBeUndefined()
        expect(pagina.agency).toEqual({ id: 8 })
        expect(pagina.relatedPosts).toEqual([{ id: 5 }])
        expect(pagina.companyMentions).toEqual([{ id: 'empresa' }])
        expect(JSON.stringify(trilha)).toContain('/groups/aespa')
    })

    it('mostra o seletor de idioma quando há outra versão', async () => {
        m.buildLanguageLinks.mockResolvedValue([{ locale: 'en', href: '/en/groups/aespa' }])
        expect((await abrir()).seletor).toBeDefined()
    })

    it('falha ao listar agências não derruba a ficha', async () => {
        m.getAgencies.mockRejectedValue(new Error('WP fora'))
        const { pagina } = await abrir()
        expect(pagina.agency).toBeUndefined()
        expect(pagina.group.slug).toBe('aespa')
    })

    it('sem tradução publicada avisa o leitor e esconde loja, posts e empresas', async () => {
        const { pagina, aviso } = await abrir('en')
        expect(aviso).toBeDefined()
        expect(pagina.relatedPosts).toEqual([])
        expect(pagina.companyMentions).toEqual([])
        expect(pagina.shopProducts).toEqual([])
        expect(pagina.shopFallback).toBe(false)
        expect(m.getVitrineGeral).not.toHaveBeenCalled()
    })

    it('com tradução publicada não leva a prateleira em português', async () => {
        m.getGroupBySlug.mockResolvedValue(grupo({ translations: { en: { title: 'aespa', content: '<p>Girl group.</p>' } } }))
        m.getStoreProductsByGroupId.mockResolvedValue([{ id: 'proprio' }])
        const { pagina, aviso } = await abrir('en')
        expect(aviso).toBeUndefined()
        expect(pagina.shopProducts).toEqual([])
        expect(m.comDescobertas).not.toHaveBeenCalled()
    })

    it('sem produto próprio usa a vitrine geral do grupo', async () => {
        const { pagina } = await abrir()
        expect(m.getVitrineGeral).toHaveBeenCalledWith('grupo:fallback', 8, 'merch', 'grupo:aespa')
        expect(pagina.shopProducts).toEqual([{ id: 'vitrine' }])
        expect(pagina.shopFallback).toBe(true)
    })

    it('com produto próprio monta a prateleira com descobertas', async () => {
        m.getStoreProductsByGroupId.mockResolvedValue([{ id: 'proprio' }])
        const { pagina } = await abrir()
        expect(pagina.shopProducts).toEqual([{ id: 'proprio' }, { id: 'descoberta' }])
        expect(pagina.shopFallback).toBe(false)
        expect(m.getVitrineGeral).not.toHaveBeenCalled()
    })

    it('busca solos só de quem segue no grupo, no máximo 6, e guarda só quem tem lançamento', async () => {
        const integrantes = Array.from({ length: 9 }, (_, i) => ({ id: 100 + i, slug: `m${i}` }))
        m.getGroupBySlug.mockResolvedValue(grupo({ acf: { members: integrantes.map(i => i.id) }, former_member_slugs: ['m0|Ex'] }))
        m.getArtistsByIds.mockResolvedValue(integrantes)
        m.getMusicReleases.mockImplementation(async ({ artistId }: { artistId?: number }) =>
            artistId === 101
                ? [lancamento(1, 'album'), lancamento(2, 'ep'), lancamento(3, 'compilation'), lancamento(4, 'single', { release_date: '', spotify_url: null })]
                : [])
        const { pagina } = await abrir()
        const pedidos = m.getMusicReleases.mock.calls.map(c => c[0].artistId).filter(Boolean)
        expect(pedidos).toEqual([101, 102, 103, 104, 105, 106])
        expect(Object.keys(pagina.soloReleases)).toEqual(['m1'])
        expect(pagina.soloReleases.m1.map((a: { type: string }) => a.type)).toEqual(['ALBUM', 'EP', 'COMPILATION', 'SINGLE'])
        expect(pagina.soloReleases.m1[3]).toMatchObject({ releaseYear: null, spotifyUrl: '' })
    })

    it('discografia herda o Spotify do grupo e liga o álbum ao artigo', async () => {
        m.getGroupBySlug.mockResolvedValue(grupo({ acf: { spotify: 'spotify-do-grupo' } }))
        m.getMusicReleases.mockResolvedValue([
            lancamento(1, 'album', { spotify_url: null }),
            lancamento(2, 'ep'),
            lancamento(3, 'compilation'),
            lancamento(4, 'single', { release_date: '' }),
        ])
        m.ligarArtigosAosAlbuns.mockReturnValue({ '2': '/blog/artigo-do-ep' })
        const { pagina } = await abrir()
        expect(pagina.discography.map((a: { type: string }) => a.type)).toEqual(['ALBUM', 'EP', 'COMPILATION', 'SINGLE'])
        expect(pagina.discography[0].spotifyUrl).toBe('spotify-do-grupo')
        expect(pagina.discography[1]).toMatchObject({ spotifyUrl: 'sp', releaseYear: 2020, articleHref: '/blog/artigo-do-ep' })
        expect(pagina.discography[3].releaseYear).toBeNull()
        expect(m.getArtigosDeAlbum).toHaveBeenCalledWith('group', 'aespa')
    })
})

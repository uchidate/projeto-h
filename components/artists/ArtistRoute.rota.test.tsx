import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

// O que a rota da ficha busca e entrega à página: 404, idioma, loja, discografia e grupo ligado.
// A página em si não é renderizada; o teste lê as props do elemento devolvido.
const m = vi.hoisted(() => ({
    getArtistBySlug: vi.fn(),
    getArtistsByIds: vi.fn(),
    getRelatedArtists: vi.fn(),
    getProductionsByArtist: vi.fn(),
    getGroupsByIds: vi.fn(),
    getGroupsByMemberId: vi.fn(),
    getPosts: vi.fn(),
    getCategories: vi.fn(),
    getAgencyById: vi.fn(),
    getStoreProductsByArtistId: vi.fn(),
    getStoreProductsByGroupId: vi.fn(),
    ordenarPrateleira: vi.fn(),
    comDescobertas: vi.fn(),
    getVitrineGeral: vi.fn(),
    getMusicReleases: vi.fn(),
    getMencoesNoAcervo: vi.fn(),
    getArtigosDeAlbum: vi.fn(),
    ligarArtigosAosAlbuns: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/lib/wordpress/artists', () => ({ getArtistBySlug: m.getArtistBySlug, getArtistsByIds: m.getArtistsByIds, getRelatedArtists: m.getRelatedArtists }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (chave: string) => chave }))
vi.mock('next/navigation', () => ({ notFound: m.notFound }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionsByArtist: m.getProductionsByArtist }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByIds: m.getGroupsByIds, getGroupsByMemberId: m.getGroupsByMemberId }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.getPosts, getCategories: m.getCategories }))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyById: m.getAgencyById }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByArtistId: m.getStoreProductsByArtistId, getStoreProductsByGroupId: m.getStoreProductsByGroupId }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: m.ordenarPrateleira }))
vi.mock('@/lib/wordpress/vitrine', () => ({ comDescobertas: m.comDescobertas, getVitrineGeral: m.getVitrineGeral }))
vi.mock('@/lib/wordpress/music', () => ({ getMusicReleases: m.getMusicReleases }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: m.getMencoesNoAcervo }))
vi.mock('@/lib/blog/albumArticles', () => ({ getArtigosDeAlbum: m.getArtigosDeAlbum, ligarArtigosAosAlbuns: m.ligarArtigosAosAlbuns }))
vi.mock('@/lib/agencies/preview', () => ({
    applyArtistManifestPreview: async (a: unknown) => a,
    applyArtistProductionsPreview: async (_slug: string, p: unknown) => p,
}))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForArtist: () => [] }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: async () => [] }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/artists/ArtistDetailPage', () => ({ ArtistDetailPage: () => null }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: () => null }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))
vi.mock('@/components/groups/GroupDiscography', () => ({}))

import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { ArtistDetailPage } from '@/components/artists/ArtistDetailPage'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { ArtistRoute } from './ArtistRoute'

const PT = DEFAULT_LOCALE
const TRADUZIDA = { en: { title: 'IU', content: '<p>South Korean singer.</p>' } }

function ficha(extra: Record<string, unknown> = {}) {
    return { id: 1, slug: 'iu', title: { rendered: 'IU' }, content: { rendered: '<p>Cantora.</p>' }, meta: {}, acf: {}, ...extra }
}

function grupo(id: number, extra: Record<string, unknown> = {}) {
    return { id, slug: `grupo-${id}`, title: { rendered: `Grupo ${id}` }, acf: {}, ...extra }
}

async function abrir(locale: Locale = PT) {
    const arvore = await ArtistRoute({ slug: 'iu', locale }) as ReactElement<{ children: unknown[] }>
    const filhos = arvore.props.children.filter(Boolean) as ReactElement<Record<string, never>>[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pagina = filhos.find(f => f.type === ArtistDetailPage)!.props as any
    return { pagina, aviso: filhos.find(f => f.type === AvisoSemTraducao) }
}

beforeEach(() => {
    for (const fn of Object.values(m)) fn.mockReset()
    m.notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    m.getArtistBySlug.mockResolvedValue(ficha())
    m.getArtistsByIds.mockResolvedValue([])
    m.getRelatedArtists.mockResolvedValue([{ id: 99 }])
    m.getProductionsByArtist.mockResolvedValue([])
    m.getGroupsByIds.mockResolvedValue([])
    m.getGroupsByMemberId.mockResolvedValue([])
    m.getPosts.mockResolvedValue({ items: [{ id: 5 }] })
    m.getCategories.mockResolvedValue([{ id: 3, name: 'Música', slug: 'musica' }])
    m.getAgencyById.mockResolvedValue({ id: 8 })
    m.getStoreProductsByArtistId.mockResolvedValue([])
    m.getStoreProductsByGroupId.mockResolvedValue([])
    m.ordenarPrateleira.mockImplementation((p: unknown[]) => p)
    m.comDescobertas.mockImplementation(async (p: unknown[]) => [...p, { id: 'descoberta' }])
    m.getVitrineGeral.mockResolvedValue([{ id: 'vitrine' }])
    m.getMusicReleases.mockResolvedValue([])
    m.getMencoesNoAcervo.mockResolvedValue([{ id: 'empresa' }])
    m.getArtigosDeAlbum.mockResolvedValue([])
    m.ligarArtigosAosAlbuns.mockReturnValue({})
})

describe('ArtistRoute', () => {
    it('ficha inexistente vira 404 sem buscar o resto', async () => {
        m.getArtistBySlug.mockResolvedValue(null)
        await expect(ArtistRoute({ slug: 'nao-existe', locale: PT })).rejects.toThrow('NEXT_NOT_FOUND')
        expect(m.getProductionsByArtist).not.toHaveBeenCalled()
    })

    it('em português entrega posts, empresas citadas e categorias, sem aviso de tradução', async () => {
        const { pagina, aviso } = await abrir()
        expect(aviso).toBeUndefined()
        expect(pagina.relatedPosts).toEqual([{ id: 5 }])
        expect(pagina.companyMentions).toEqual([{ id: 'empresa' }])
        expect(pagina.categoryMap).toEqual({ 3: { name: 'Música', slug: 'musica' } })
    })

    it('sem tradução publicada avisa o leitor e esconde loja, posts e empresas', async () => {
        const { pagina, aviso } = await abrir('en')
        expect(aviso).toBeDefined()
        expect(pagina.relatedPosts).toEqual([])
        expect(pagina.companyMentions).toEqual([])
        expect(pagina.shopProducts).toEqual([])
        expect(pagina.shopFallback).toBe(false)
        expect(m.getVitrineGeral).not.toHaveBeenCalled()
        expect(m.getMencoesNoAcervo).not.toHaveBeenCalled()
    })

    it('com tradução publicada mostra o texto traduzido, sem aviso nem loja', async () => {
        m.getArtistBySlug.mockResolvedValue(ficha({ translations: TRADUZIDA }))
        m.getStoreProductsByArtistId.mockResolvedValue([{ id: 'proprio' }])
        m.getGroupsByMemberId.mockResolvedValue([grupo(10)])
        const { pagina, aviso } = await abrir('en')
        expect(aviso).toBeUndefined()
        expect(pagina.artist.content.rendered).toContain('South Korean singer')
        expect(pagina.shopProducts).toEqual([])
        expect(m.getStoreProductsByGroupId).not.toHaveBeenCalled()
        expect(m.getArtigosDeAlbum).not.toHaveBeenCalled()
    })

    it('busca grupos pelo vínculo da ficha e, sem vínculo, pelo id do artista', async () => {
        await abrir()
        expect(m.getGroupsByMemberId).toHaveBeenCalledWith(1)
        expect(m.getGroupsByIds).not.toHaveBeenCalled()

        m.getArtistBySlug.mockResolvedValue(ficha({ acf: { groups: [10] } }))
        await abrir()
        expect(m.getGroupsByIds).toHaveBeenCalledWith([10])
    })

    it('só busca a agência quando a ficha aponta uma', async () => {
        expect((await abrir()).pagina.agency).toBeUndefined()
        expect(m.getAgencyById).not.toHaveBeenCalled()

        m.getArtistBySlug.mockResolvedValue(ficha({ acf: { agency: 8 } }))
        expect((await abrir()).pagina.agency).toEqual({ id: 8 })
    })

    it('prefere o grupo ativo e lista até 10 colegas, sem a própria pessoa', async () => {
        const colegas = Array.from({ length: 14 }, (_, i) => i + 1)
        m.getGroupsByMemberId.mockResolvedValue([
            grupo(10, { acf: { active: false, members: [1, 50] } }),
            grupo(11, { acf: { members: colegas } }),
        ])
        const { pagina } = await abrir()
        expect(pagina.connectionGroup.id).toBe(11)
        expect(m.getArtistsByIds).toHaveBeenCalledWith(colegas.slice(1, 11))
        expect(m.getRelatedArtists).not.toHaveBeenCalled()
        expect(m.getStoreProductsByGroupId).toHaveBeenCalledWith(11)
    })

    it('usa o primeiro grupo quando todos acabaram', async () => {
        m.getGroupsByMemberId.mockResolvedValue([grupo(10, { acf: { active: false, members: [1, 2] } })])
        expect((await abrir()).pagina.connectionGroup.id).toBe(10)
    })

    it('grupo sem colegas não vira bloco de conexão e cai nos artistas relacionados', async () => {
        m.getArtistBySlug.mockResolvedValue(ficha({ acf: { roles: ['singer'], agency: 8 } }))
        m.getGroupsByMemberId.mockResolvedValue([grupo(10, { acf: { members: [1] } })])
        const { pagina } = await abrir()
        expect(pagina.connectionGroup).toBeUndefined()
        expect(m.getRelatedArtists).toHaveBeenCalledWith(1, 8, 'singer')
        expect(pagina.relatedArtists).toEqual([{ id: 99 }])
    })

    it.each([
        ['actor', 'drama'],
        ['host', 'drama'],
        ['singer', 'merch'],
        [undefined, 'merch'],
    ])('sem grupo, papel %s recebe a vitrine %s', async (papel, tipo) => {
        m.getArtistBySlug.mockResolvedValue(ficha({ acf: { roles: papel ? [papel] : [] } }))
        const { pagina } = await abrir()
        expect(m.getVitrineGeral).toHaveBeenCalledWith('artista:fallback', 8, tipo, 'artista:iu')
        expect(pagina.shopProducts).toEqual([{ id: 'vitrine' }])
        expect(pagina.shopFallback).toBe(true)
    })

    it('ator que está em grupo recebe itens de K-pop', async () => {
        m.getArtistBySlug.mockResolvedValue(ficha({ acf: { roles: ['actor'] } }))
        m.getGroupsByMemberId.mockResolvedValue([grupo(10)])
        expect((await abrir()).pagina.shopFallbackTipo).toBe('merch')
    })

    it('produto próprio entra na prateleira com descobertas, sem vitrine geral', async () => {
        m.getStoreProductsByArtistId.mockResolvedValue([{ id: 'proprio' }])
        const { pagina } = await abrir()
        expect(pagina.shopProducts).toEqual([{ id: 'proprio' }, { id: 'descoberta' }])
        expect(pagina.shopFallback).toBe(false)
        expect(m.getVitrineGeral).not.toHaveBeenCalled()
    })

    it('produto do grupo já basta para não usar a vitrine geral', async () => {
        m.getGroupsByMemberId.mockResolvedValue([grupo(10)])
        m.getStoreProductsByGroupId.mockResolvedValue([{ id: 'do-grupo' }])
        const { pagina } = await abrir()
        expect(pagina.groupShopProducts).toEqual([{ id: 'do-grupo' }])
        expect(pagina.shopFallback).toBe(false)
        expect(m.ordenarPrateleira).toHaveBeenCalledWith([{ id: 'do-grupo' }], 'artista:iu:grupo:grupo-10')
    })

    it('converte os lançamentos e liga o álbum ao artigo do site', async () => {
        const lancamento = (id: number, release_type: string, extra: Record<string, unknown> = {}) =>
            ({ id, title: `L${id}`, release_type, release_date: '2021-03-25', cover_url: 'capa', spotify_url: 'sp', ...extra })
        m.getMusicReleases.mockResolvedValue([
            lancamento(1, 'album'),
            lancamento(2, 'ep'),
            lancamento(3, 'compilation'),
            lancamento(4, 'single', { release_date: '', spotify_url: null }),
        ])
        m.ligarArtigosAosAlbuns.mockReturnValue({ '1': '/blog/artigo-do-album' })
        const { pagina } = await abrir()
        expect(pagina.discography.map((a: { type: string }) => a.type)).toEqual(['ALBUM', 'EP', 'COMPILATION', 'SINGLE'])
        expect(pagina.discography[0]).toMatchObject({ id: '1', releaseYear: 2021, articleHref: '/blog/artigo-do-album' })
        expect(pagina.discography[3]).toMatchObject({ releaseYear: null, spotifyUrl: '' })
        expect(m.getArtigosDeAlbum).toHaveBeenCalledWith('artist', 'iu')
    })
})

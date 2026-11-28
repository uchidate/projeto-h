import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
    artista: vi.fn(), artistas: vi.fn(), porIds: vi.fn(),
    grupo: vi.fn(), gruposDoMembro: vi.fn(), parentes: vi.fn(),
    obra: vi.fn(), obrasDoArtista: vi.fn(), parecidas: vi.fn(),
}))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistBySlug: m.artista, getArtists: m.artistas, getArtistsByIds: m.porIds }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupBySlug: m.grupo, getGroupsByMemberId: m.gruposDoMembro, getRelatedGroups: m.parentes }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionBySlug: m.obra, getProductionsByArtist: m.obrasDoArtista, getSmartRelatedProductions: m.parecidas }))

import { getConexoes } from './conexoes'

const item = (id: number, slug: string, extra: object = {}) => ({ id, slug, title: { rendered: slug }, ...extra })
const muitos = (n: number, prefixo: string, base = 10) => Array.from({ length: n }, (_, i) => item(base + i, `${prefixo}${i}`))

beforeEach(() => Object.values(m).forEach(f => f.mockReset()))

describe('getConexoes (artista)', () => {
    it('devolve null para artista inexistente', async () => {
        m.artista.mockResolvedValue(null)
        expect(await getConexoes('artist', 'nada')).toBeNull()
    })

    it('liga grupo, até cinco colegas (sem a própria pessoa) e três obras', async () => {
        m.artista.mockResolvedValue(item(1, 'karina'))
        m.gruposDoMembro.mockResolvedValue([item(2, 'aespa', { acf: { members: [1, 10] } })])
        m.porIds.mockResolvedValue([item(1, 'karina'), ...muitos(7, 'colega')])
        m.obrasDoArtista.mockResolvedValue(muitos(5, 'obra', 30))
        const r = await getConexoes('artist', 'karina')
        expect(r?.centro).toEqual({ label: 'karina', img: null, href: '/artists/karina', tipo: 'artist' })
        expect(r?.nos.map(n => n.tipo)).toEqual(['grupo', ...Array(5).fill('artista'), ...Array(3).fill('obra')])
        expect(r?.nos.map(n => n.href)).not.toContain('/artists/karina')
    })

    it('sem grupo mostra só as obras', async () => {
        m.artista.mockResolvedValue(item(1, 'solo'))
        m.gruposDoMembro.mockResolvedValue([])
        m.obrasDoArtista.mockResolvedValue([{ slug: 'obra', featured_image_url: 'u' }])
        const r = await getConexoes('artist', 'solo')
        expect(r?.nos).toEqual([{ href: '/productions/obra', label: '', img: 'u', tipo: 'obra' }])
        expect(m.porIds).not.toHaveBeenCalled()
    })
})

describe('getConexoes (produção)', () => {
    it('devolve null para obra inexistente', async () => {
        m.obra.mockResolvedValue(null)
        expect(await getConexoes('production', 'nada')).toBeNull()
    })

    it('busca até seis do elenco e três obras parecidas', async () => {
        m.obra.mockResolvedValue(item(5, 'serie', { production_cast: muitos(8, 'ator'), production_genre: [3], acf: { type: 'drama' } }))
        m.artistas.mockResolvedValue({ items: [item(1, 'ator0')] })
        m.parecidas.mockResolvedValue(muitos(4, 'par'))
        const r = await getConexoes('production', 'serie')
        expect(m.artistas).toHaveBeenCalledWith({ slug: 'ator0,ator1,ator2,ator3,ator4,ator5', perPage: 6 })
        expect(m.parecidas).toHaveBeenCalledWith(expect.objectContaining({ excludeId: 5, genreId: 3, type: 'drama' }))
        expect(r?.nos.map(n => n.tipo)).toEqual(['artista', 'obra', 'obra', 'obra'])
    })

    it('usa artist_slugs quando não há elenco e não busca ninguém sem nenhum dos dois', async () => {
        m.parecidas.mockResolvedValue([])
        m.artistas.mockResolvedValue({ items: [] })
        m.obra.mockResolvedValue(item(5, 'serie', { artist_slugs: ['iu'] }))
        await getConexoes('production', 'serie')
        expect(m.artistas).toHaveBeenCalledWith({ slug: 'iu', perPage: 1 })
        m.artistas.mockClear()
        m.obra.mockResolvedValue(item(6, 'vazia'))
        expect((await getConexoes('production', 'vazia'))?.nos).toEqual([])
        expect(m.artistas).not.toHaveBeenCalled()
    })
})

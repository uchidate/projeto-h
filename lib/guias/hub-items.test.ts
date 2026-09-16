import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wordpress/productions', () => ({ getProductions: vi.fn() }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: vi.fn(), getArtistsByIds: vi.fn() }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: vi.fn() }))

import { getProductions } from '@/lib/wordpress/productions'
import { getArtists, getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { getHubItems } from './hub-items'
import type { ArchiveHub } from './types'

function hub(overrides: Partial<ArchiveHub> = {}): ArchiveHub {
    return {
        slug: 'test-hub', kind: 'productions', title: 't', shortTitle: 't', description: 'd',
        intro: [], keywords: [], faq: [], filter: {},
        ...overrides,
    }
}

describe('getHubItems', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.mocked(getProductions).mockReset()
        vi.mocked(getArtists).mockReset()
        vi.mocked(getArtistsByIds).mockReset()
        vi.mocked(getGroups).mockReset()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    describe('kind: productions', () => {
        it('busca produções com os filtros do hub e ordena por trending_score', async () => {
            vi.mocked(getProductions).mockResolvedValue({ items: [{ id: 1 }], total: 1 } as never)
            const h = hub({ kind: 'productions', filter: { genre: 'romance' } })
            const result = await getHubItems(h)
            expect(result).toEqual({ kind: 'productions', items: [{ id: 1 }], total: 1 })
            expect(getProductions).toHaveBeenCalledWith(expect.objectContaining({ genre: 'romance', orderby: 'trending_score', order: 'desc' }))
        })

        it('filtros de opts (vindos da URL) têm prioridade sobre os do hub', async () => {
            vi.mocked(getProductions).mockResolvedValue({ items: [], total: 0 } as never)
            const h = hub({ kind: 'productions', filter: { genre: 'romance' } })
            await getHubItems(h, { genre: 'comedia' })
            expect(getProductions).toHaveBeenCalledWith(expect.objectContaining({ genre: 'comedia' }))
        })
    })

    describe('kind: artists', () => {
        it('sem nenhum filtro especial, lista artistas ordenados por título', async () => {
            vi.mocked(getArtists).mockResolvedValue({ items: [{ id: 1 }], total: 1 } as never)
            const result = await getHubItems(hub({ kind: 'artists' }))
            expect(result).toEqual({ kind: 'artists', items: [{ id: 1 }], total: 1 })
        })

        it('com filter.groupSlug, resolve os membros do grupo e busca por ID', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [{ acf: { members: [1, 2, 3] } }] })
            vi.mocked(getArtistsByIds).mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }] as never)
            const result = await getHubItems(hub({ kind: 'artists', filter: { groupSlug: 'bts' } }))
            expect(getArtistsByIds).toHaveBeenCalledWith([1, 2, 3])
            expect(result).toEqual({ kind: 'artists', items: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 3 })
        })

        it('groupSlug sem membros retorna vazio sem chamar getArtistsByIds', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [{ acf: {} }] })
            const result = await getHubItems(hub({ kind: 'artists', filter: { groupSlug: 'grupo-sem-membros' } }))
            expect(getArtistsByIds).not.toHaveBeenCalled()
            expect(result).toEqual({ kind: 'artists', items: [], total: 0 })
        })

        it('com filter.agencyName, resolve o ID da agência antes de buscar', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [{ id: 55, title: { rendered: 'SM Entertainment' } }] })
            vi.mocked(getArtists).mockResolvedValue({ items: [{ id: 1 }], total: 1 } as never)
            const result = await getHubItems(hub({ kind: 'artists', filter: { agencyName: 'SM Entertainment' } }))
            expect(getArtists).toHaveBeenCalledWith(expect.objectContaining({ agency: 55 }))
            expect(result.total).toBe(1)
        })

        it('agencyName não encontrada retorna vazio sem chamar getArtists', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const result = await getHubItems(hub({ kind: 'artists', filter: { agencyName: 'Agência Inexistente' } }))
            expect(getArtists).not.toHaveBeenCalled()
            expect(result).toEqual({ kind: 'artists', items: [], total: 0 })
        })

        it('com filter.role, busca por role/gender', async () => {
            vi.mocked(getArtists).mockResolvedValue({ items: [], total: 0 } as never)
            await getHubItems(hub({ kind: 'artists', filter: { role: 'singer', gender: 'female' } }))
            expect(getArtists).toHaveBeenCalledWith(expect.objectContaining({ role: 'singer', gender: 'female' }))
        })
    })

    describe('kind: groups', () => {
        it('sem filtro especial, lista grupos ordenados por título', async () => {
            vi.mocked(getGroups).mockResolvedValue({ items: [{ id: 1 }], total: 1 } as never)
            const result = await getHubItems(hub({ kind: 'groups' }))
            expect(result).toEqual({ kind: 'groups', items: [{ id: 1 }], total: 1 })
        })

        it('com filtro de estreia, busca só grupos que estrearam no intervalo', async () => {
            vi.mocked(getGroups).mockResolvedValue({ items: [{ id: 7 }], total: 1 } as never)
            const result = await getHubItems(hub({ kind: 'groups', filter: { debutYearMin: 2018, debutYearMax: 2022 } }))
            expect(result).toEqual({ kind: 'groups', items: [{ id: 7 }], total: 1 })
            expect(getGroups).toHaveBeenCalledWith(expect.objectContaining({ debutMin: '20180101', debutMax: '20221231' }))
        })

        it('com filter.role, busca por type (girl_group/boy_group/etc)', async () => {
            vi.mocked(getGroups).mockResolvedValue({ items: [], total: 0 } as never)
            await getHubItems(hub({ kind: 'groups', filter: { role: 'girl_group' } }))
            expect(getGroups).toHaveBeenCalledWith(expect.objectContaining({ type: 'girl_group' }))
        })
    })

    // Regressão: o catch-all de erro devolvia sempre kind:'productions', mesmo
    // pra hubs de artista/grupo — a página consumidora decide qual prop passar
    // (productions/artists/groups) com base nesse kind, então um hub de artista
    // que falhasse virava "sem produções" em vez de "sem artistas" (undefined
    // no lugar de [] pro componente certo).
    it('em caso de erro, o fallback mantém o kind do hub original (não força "productions")', async () => {
        vi.mocked(getArtists).mockRejectedValue(new Error('WP fora do ar'))
        const result = await getHubItems(hub({ kind: 'artists' }))
        expect(result).toEqual({ kind: 'artists', items: [], total: 0 })
    })

    it('em caso de erro num hub de grupos, o fallback também mantém kind:"groups"', async () => {
        vi.mocked(getGroups).mockRejectedValue(new Error('WP fora do ar'))
        const result = await getHubItems(hub({ kind: 'groups' }))
        expect(result).toEqual({ kind: 'groups', items: [], total: 0 })
    })

    it('em caso de erro num hub de produções, o fallback mantém kind:"productions" (comportamento original preservado)', async () => {
        vi.mocked(getProductions).mockRejectedValue(new Error('WP fora do ar'))
        const result = await getHubItems(hub({ kind: 'productions' }))
        expect(result).toEqual({ kind: 'productions', items: [], total: 0 })
    })
})

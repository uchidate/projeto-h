import { beforeEach, describe, expect, it, vi } from 'vitest'

const estados = vi.fn()
const artistas = vi.fn()
const grupos = vi.fn()
const posts = vi.fn()
vi.mock('@/lib/wordpress/userApi', () => ({ getUserContentStates: (...a: unknown[]) => estados(...a) }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: (...a: unknown[]) => artistas(...a) }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByIds: (...a: unknown[]) => grupos(...a) }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: (...a: unknown[]) => posts(...a) }))

import { carregarSeguindo } from './seguindo'

const post = (id: number, date: string) => ({ id, slug: `p${id}`, title: { rendered: `Post ${id}` }, date, featured_image_url: null })

describe('carregarSeguindo', () => {
    beforeEach(() => vi.clearAllMocks())

    it('junta os seguidos, tira matéria repetida e ordena pela mais nova', async () => {
        estados.mockResolvedValue({ states: [
            { objectType: 'artist', objectId: 1, state: 'following', updatedAt: '2026-10-01' },
            { objectType: 'group', objectId: 2, state: 'following', updatedAt: '2026-10-02' },
            { objectType: 'artist', objectId: 9, state: 'favorite' },
        ] })
        artistas.mockResolvedValue([{ id: 1, slug: 'a', title: { rendered: 'Taemin' } }])
        grupos.mockResolvedValue([{ id: 2, slug: 'g', title: { rendered: 'ILLIT' } }])
        posts.mockImplementation(async (q: { mentionsSlug: string }) => ({ items: q.mentionsSlug === 'a' ? [post(1, '2026-10-20T10:00:00'), post(2, '2026-10-22T10:00:00')] : [post(2, '2026-10-22T10:00:00')] }))
        const r = await carregarSeguindo('t')
        expect(r.nomes).toEqual(['Taemin', 'ILLIT'])
        expect(r.novidades.map(n => n.id)).toEqual([2, 1])
        expect(artistas).toHaveBeenCalledWith([1])
    })

    it('sem ninguém seguido devolve vazio', async () => {
        estados.mockResolvedValue({ states: [] })
        artistas.mockResolvedValue([]); grupos.mockResolvedValue([])
        expect(await carregarSeguindo('t')).toEqual({ nomes: [], novidades: [] })
    })
})

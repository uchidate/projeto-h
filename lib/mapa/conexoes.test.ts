import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/wordpress/artists', () => ({ getArtistBySlug: vi.fn(), getArtists: vi.fn(), getArtistsByIds: vi.fn() }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupBySlug: vi.fn(), getGroupsByMemberId: vi.fn(), getRelatedGroups: vi.fn() }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionBySlug: vi.fn(), getProductionsByArtist: vi.fn(), getSmartRelatedProductions: vi.fn() }))

import * as groups from '@/lib/wordpress/groups'
import { getConexoes } from './conexoes'

const g = (id: number, slug: string, extra: object = {}) => ({ id, slug, title: { rendered: slug }, featured_image_url: null, acf: { ...extra } })

describe('getConexoes (grupo)', () => {
    beforeEach(() => vi.clearAllMocks())

    it('devolve null quando o grupo não existe', async () => {
        vi.mocked(groups.getGroupBySlug).mockResolvedValue(null)
        expect(await getConexoes('group', 'nada')).toBeNull()
    })

    it('exclui da mesma agência os encerrados e os inativos', async () => {
        vi.mocked(groups.getGroupBySlug).mockResolvedValue(g(1, 'skz', { members: [] }) as never)
        vi.mocked(groups.getRelatedGroups).mockResolvedValue([
            g(2, 'day6', { active: true }),
            g(3, 'wonder-girls', { active: false }),
            g(4, 'jyp-antigo', { disbandment_date: '2017-02-01' }),
        ] as never)
        const r = await getConexoes('group', 'skz')
        expect(r?.nos.map(n => n.label)).toEqual(['day6'])
        expect(r?.nos[0].anel).toBe('fora')
    })
})

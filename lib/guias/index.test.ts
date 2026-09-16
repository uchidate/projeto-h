import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/wordpress/guias', () => ({
    getGuias: vi.fn(),
    getGuia: vi.fn(),
}))

import { getGuias, getGuia } from '@/lib/wordpress/guias'
import { getAllHubs, getHub, getRelatedHubs, ALL_HUBS } from './index'

describe('getAllHubs', () => {
    beforeEach(() => {
        vi.mocked(getGuias).mockReset()
    })

    it('retorna os guias do WP quando a API retorna pelo menos 1', async () => {
        const wpHubs = [{ slug: 'wp-hub', kind: 'productions', filter: {} }]
        vi.mocked(getGuias).mockResolvedValue(wpHubs as never)
        expect(await getAllHubs()).toBe(wpHubs)
    })

    it('cai pro fallback estático quando o WP retorna array vazio', async () => {
        vi.mocked(getGuias).mockResolvedValue([])
        const result = await getAllHubs()
        expect(result).toBe(ALL_HUBS)
        expect(result.length).toBeGreaterThan(0)
    })

    it('cai pro fallback estático quando o WP lança erro (silencioso, não propaga)', async () => {
        vi.mocked(getGuias).mockRejectedValue(new Error('WP fora do ar'))
        const result = await getAllHubs()
        expect(result).toBe(ALL_HUBS)
    })
})

describe('getHub', () => {
    beforeEach(() => {
        vi.mocked(getGuia).mockReset()
    })

    it('retorna o guia do WP quando encontrado', async () => {
        const wpHub = { slug: 'doramas-romanticos', kind: 'productions', filter: { genre: 'romance' } }
        vi.mocked(getGuia).mockResolvedValue(wpHub as never)
        expect(await getHub('doramas-romanticos')).toBe(wpHub)
    })

    it('cai pro fallback estático quando o WP retorna null/undefined', async () => {
        vi.mocked(getGuia).mockResolvedValue(undefined as never)
        const staticHub = ALL_HUBS[0]
        expect(await getHub(staticHub.slug)).toEqual(staticHub)
    })

    it('cai pro fallback estático quando o WP lança erro', async () => {
        vi.mocked(getGuia).mockRejectedValue(new Error('WP fora do ar'))
        const staticHub = ALL_HUBS[0]
        expect(await getHub(staticHub.slug)).toEqual(staticHub)
    })

    it('retorna undefined quando o slug não existe nem no WP nem no fallback', async () => {
        vi.mocked(getGuia).mockResolvedValue(undefined as never)
        expect(await getHub('slug-que-nao-existe-em-lugar-nenhum')).toBeUndefined()
    })
})

describe('getRelatedHubs', () => {
    beforeEach(() => {
        vi.mocked(getGuias).mockReset()
    })

    it('retorna hubs do mesmo kind, excluindo o próprio hub', async () => {
        vi.mocked(getGuias).mockResolvedValue([])
        const target = ALL_HUBS.find(h => h.kind === 'productions')!
        const related = await getRelatedHubs(target)
        expect(related.every(h => h.kind === 'productions')).toBe(true)
        expect(related.some(h => h.slug === target.slug)).toBe(false)
    })

    it('respeita o limit (default 6)', async () => {
        vi.mocked(getGuias).mockResolvedValue([])
        const target = ALL_HUBS.find(h => h.kind === 'productions')!
        const related = await getRelatedHubs(target)
        expect(related.length).toBeLessThanOrEqual(6)
    })

    it('respeita um limit customizado', async () => {
        vi.mocked(getGuias).mockResolvedValue([])
        const target = ALL_HUBS.find(h => h.kind === 'productions')!
        const related = await getRelatedHubs(target, 2)
        expect(related.length).toBeLessThanOrEqual(2)
    })
})

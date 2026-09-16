import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getGroups, getGroupsByIds, getGroupsByMemberId, getRelatedGroups, getGroupBySlug } from './groups'

function group(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

describe('getGroups', () => {
    it('consulta várias organizações em uma única chamada', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        vi.stubGlobal('fetch', fetchMock)
        await getGroups({ agencies: [4, 5] })
        expect(fetchMock.mock.calls[0][0] as string).toContain('oc_agencies=4%2C5')
        vi.unstubAllGlobals()
    })
})

describe('getGroupsByIds', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio sem fetch quando ids é vazio', async () => {
        expect(await getGroupsByIds([])).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna os grupos quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [group(1, 'bts')] })
        expect(await getGroupsByIds([1])).toEqual([group(1, 'bts')])
    })
})

describe('getGroupsByMemberId', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio sem fetch quando memberId é 0/falsy', async () => {
        expect(await getGroupsByMemberId(0)).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna os grupos do membro quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [group(1, 'bts')] })
        expect(await getGroupsByMemberId(42)).toEqual([group(1, 'bts')])
    })

    it('retorna array vazio (não lança) em caso de erro de rede', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getGroupsByMemberId(42)).toEqual([])
    })
})

describe('getRelatedGroups', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna os grupos relacionados quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [group(1, 'blackpink')] })
        expect(await getRelatedGroups(99, 42)).toEqual([group(1, 'blackpink')])
    })

    it('respeita o perPage', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => Array.from({ length: 10 }, (_, i) => group(i, `g${i}`)) })
        const result = await getRelatedGroups(99, undefined, 3)
        expect(result).toHaveLength(3)
    })

    it('retorna array vazio (não lança) em caso de erro de rede', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getRelatedGroups(99)).toEqual([])
    })
})

describe('getGroupBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna o primeiro item quando encontrado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [group(1, 'bts')] })
        expect(await getGroupBySlug('bts')).toEqual(group(1, 'bts'))
    })

    it('retorna null quando o slug não existe', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getGroupBySlug('slug-inexistente')).toBeNull()
    })
})

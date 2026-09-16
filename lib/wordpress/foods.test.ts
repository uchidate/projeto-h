import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFoodBySlug, getFoodsByIds, getRelatedFoods } from './foods'

function food(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

describe('getFoodBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna o primeiro item quando a API responde com resultados', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [food(1, 'kimchi')] })
        expect(await getFoodBySlug('kimchi')).toEqual(food(1, 'kimchi'))
    })

    it('retorna null quando a API responde array vazio (slug não existe)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getFoodBySlug('slug-inexistente')).toBeNull()
    })
})

describe('getFoodsByIds', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna array vazio sem fazer fetch quando a lista de IDs é vazia', async () => {
        expect(await getFoodsByIds([])).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna os itens quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [food(1, 'kimchi'), food(2, 'bulgogi')] })
        const result = await getFoodsByIds([1, 2])
        expect(result).toHaveLength(2)
    })

    it('retorna array vazio (não lança) quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getFoodsByIds([1, 2])).toEqual([])
    })
})

describe('getRelatedFoods', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna array vazio (não lança) quando o pool vem vazio', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getRelatedFoods(1)).toEqual([])
    })

    it('retorna array vazio (não lança) quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getRelatedFoods(1)).toEqual([])
    })

    it('respeita o perPage, limitando o resultado', async () => {
        const pool = Array.from({ length: 10 }, (_, i) => food(i, `food-${i}`))
        fetchMock.mockResolvedValue({ ok: true, json: async () => pool })
        const result = await getRelatedFoods(1, undefined, 3)
        expect(result).toHaveLength(3)
    })

    it('rotaciona o pool de forma determinística com base no excludeId (seed)', async () => {
        const pool = Array.from({ length: 5 }, (_, i) => food(i, `food-${i}`))
        fetchMock.mockResolvedValue({ ok: true, json: async () => pool })
        // seed = excludeId % pool.length = 12 % 5 = 2 → rotaciona a partir do índice 2
        const result = await getRelatedFoods(12, undefined, 5)
        expect(result.map(f => f.id)).toEqual([2, 3, 4, 0, 1])
    })

    it('é determinístico: mesmo excludeId sempre produz a mesma ordem', async () => {
        const pool = Array.from({ length: 5 }, (_, i) => food(i, `food-${i}`))
        fetchMock.mockResolvedValue({ ok: true, json: async () => pool })
        const result1 = await getRelatedFoods(7, undefined, 5)
        const result2 = await getRelatedFoods(7, undefined, 5)
        expect(result1.map(f => f.id)).toEqual(result2.map(f => f.id))
    })

    it('lida com pool de tamanho 1 sem dividir por zero', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [food(1, 'kimchi')] })
        const result = await getRelatedFoods(1, undefined, 5)
        expect(result).toEqual([food(1, 'kimchi')])
    })
})

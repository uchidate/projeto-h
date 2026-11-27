import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getArtistsByIds } from './artists'
import { getCompaniesByIds } from './companies'
import { getFoodsByIds } from './foods'
import { getGroupsByIds } from './groups'
import { getProductionsByIds } from './productions'

const { buscar } = vi.hoisted(() => ({ buscar: vi.fn() }))

vi.mock('./client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./client')>()),
    wpBuscarOpcional: buscar,
}))

const parametros = (caminho: string) => new URL(caminho, 'https://wp.test').searchParams
const faixa = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

/** Imita o WordPress: recusa `per_page` acima de 100 e devolve os itens na ordem pedida. */
async function wordpress(caminho: string) {
    const p = parametros(caminho)
    if (Number(p.get('per_page')) > 100) throw new Error('rest_invalid_param')
    return p.get('include')!.split(',').map(id => ({ id: Number(id) }))
}

describe.each([
    ['artistas', getArtistsByIds],
    ['grupos', getGroupsByIds],
    ['produções', getProductionsByIds],
    ['empresas', getCompaniesByIds],
    ['comidas', getFoodsByIds],
] as [string, (ids: number[]) => Promise<{ id: number }[]>][])('busca de %s por id', (_, porIds) => {
    beforeEach(() => {
        buscar.mockReset()
        buscar.mockImplementation(wordpress)
    })

    it('sem ids não consulta o WordPress', async () => {
        expect(await porIds([])).toEqual([])
        expect(buscar).not.toHaveBeenCalled()
    })

    it('até 100 ids faz uma consulta só', async () => {
        expect(await porIds(faixa(100))).toHaveLength(100)
        expect(buscar).toHaveBeenCalledTimes(1)
    })

    it('acima de 100 parte em lotes e mantém a ordem pedida', async () => {
        const ids = faixa(230).reverse()
        const itens = await porIds(ids)
        expect(itens.map(i => i.id)).toEqual(ids)
        expect(buscar.mock.calls.map(([c]) => Number(parametros(c).get('per_page')))).toEqual([100, 100, 30])
    })

    it('id repetido não duplica o item entre lotes', async () => {
        const ids = [...faixa(100), 1, 101]
        expect((await porIds(ids)).map(i => i.id)).toEqual(faixa(101))
    })

    it('falha do WordPress devolve lista vazia', async () => {
        buscar.mockRejectedValue(new Error('fora do ar'))
        expect(await porIds(faixa(150))).toEqual([])
    })
})

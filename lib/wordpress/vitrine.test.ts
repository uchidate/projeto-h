import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoreProduct } from './store'

const mocks = vi.hoisted(() => ({
    todos: vi.fn(),
    destaques: vi.fn(),
    porArtista: vi.fn(),
    porIds: vi.fn(),
    descobertas: vi.fn(),
    ordenar: vi.fn(),
}))

vi.mock('@/lib/wordpress/store', async importar => ({
    ...(await importar<typeof import('./store')>()),
    getStoreProducts: mocks.todos,
    getFeaturedStoreProducts: mocks.destaques,
    getStoreProductsByArtistId: mocks.porArtista,
    getStoreProductsByIds: mocks.porIds,
}))
// O ranking real lê um arquivo de cliques do deploy; aqui a ordem precisa ser previsível.
vi.mock('@/lib/wordpress/store-ranking', () => ({
    ordenarPrateleira: mocks.ordenar,
    candidatosDescoberta: mocks.descobertas,
}))

import {
    buildVitrineMatcher, comDescobertas, getPrateleiraDaObra, getVitrineGeral, getVitrineMaratona,
    getVitrinePorTermos, getVitrineTematica, getVitrineVinculada,
} from './vitrine'

function produto(id: number, titulo: string, acf: Partial<StoreProduct['acf']> = {}): StoreProduct {
    return {
        id,
        title: { rendered: titulo },
        acf: {
            affiliate_url: `https://loja.exemplo/${id}`,
            image_url: `https://img.exemplo/${id}.jpg`,
            price: 'R$ 10,00',
            category: 'outros',
            position: id,
            ...acf,
        },
    } as StoreProduct
}

const ids = (lista: StoreProduct[]) => lista.map(p => p.id)

beforeEach(() => {
    vi.resetAllMocks()
    mocks.todos.mockResolvedValue([])
    mocks.destaques.mockResolvedValue([])
    mocks.porArtista.mockResolvedValue([])
    mocks.porIds.mockResolvedValue([])
    mocks.descobertas.mockReturnValue([])
    // Aderência primeiro, ordem de entrada depois.
    mocks.ordenar.mockImplementation((lista: StoreProduct[], _contexto?: string, aderencia?: Map<number, number>) =>
        [...lista].sort((a, b) => (aderencia?.get(b.id) ?? 0) - (aderencia?.get(a.id) ?? 0)))
})

describe('buildVitrineMatcher', () => {
    it('casa o termo com o título de um produto à venda, sem diferenciar maiúsculas', async () => {
        mocks.todos.mockResolvedValue([produto(1, 'Lightstick SEVENTEEN')])
        const tem = await buildVitrineMatcher()
        expect(tem(['Seventeen'])).toBe(true)
        expect(tem(['Stray Kids'])).toBe(false)
    })

    it('ignora produto escondido, sem link ou sem preço', async () => {
        mocks.todos.mockResolvedValue([
            produto(1, 'Escondido Alfa', { is_hidden: true }),
            produto(2, 'Semlink Beta', { affiliate_url: '' }),
            produto(3, 'Sempreco Gama', { price: '' }),
        ])
        const tem = await buildVitrineMatcher()
        expect(tem(['Alfa'])).toBe(false)
        expect(tem(['Beta'])).toBe(false)
        expect(tem(['Gama'])).toBe(false)
    })

    it('descarta termo vazio ou curto demais e busca o catálogo uma vez só', async () => {
        mocks.todos.mockResolvedValue([produto(1, 'Chá de cevada')])
        const tem = await buildVitrineMatcher()
        expect(tem([undefined, 'chá'])).toBe(false)
        expect(tem([])).toBe(false)
        expect(tem(['cevada'])).toBe(true)
        expect(mocks.todos).toHaveBeenCalledTimes(1)
    })
})

describe('comDescobertas', () => {
    it('acrescenta os candidatos ao fim da lista', async () => {
        const lista = [produto(1, 'Um')]
        mocks.descobertas.mockReturnValue([produto(2, 'Dois')])
        expect(ids(await comDescobertas(lista, 'ctx'))).toEqual([1, 2])
        expect(mocks.descobertas).toHaveBeenCalledWith(lista, [], 'ctx')
    })

    it('não busca o catálogo para lista vazia', async () => {
        expect(await comDescobertas([], 'ctx')).toEqual([])
        expect(mocks.todos).not.toHaveBeenCalled()
    })

    it('devolve a lista como veio quando o catálogo falha', async () => {
        mocks.todos.mockRejectedValue(new Error('rede'))
        expect(ids(await comDescobertas([produto(1, 'Um')], 'ctx'))).toEqual([1])
    })
})

describe('getVitrineGeral', () => {
    const pool = Array.from({ length: 12 }, (_, i) => produto(i + 1, `Produto ${i + 1}`, { category: `c${i}` }))

    it('pede um pool maior que a faixa e devolve a quantidade pedida', async () => {
        mocks.destaques.mockResolvedValue(pool)
        const faixa = await getVitrineGeral('home', 4, 'kdrama' as never)
        expect(faixa).toHaveLength(4)
        expect(mocks.destaques).toHaveBeenCalledWith(24, 'kdrama')
    })

    it('a mesma semente repete o sorteio e sementes diferentes variam a faixa', async () => {
        mocks.destaques.mockResolvedValue(pool)
        const a = ids(await getVitrineGeral('artista:fallback', 4, undefined, 'artista:a'))
        expect(ids(await getVitrineGeral('artista:fallback', 4, undefined, 'artista:a'))).toEqual(a)
        const outras = await Promise.all(['b', 'c', 'd', 'e', 'f'].map(s => getVitrineGeral('artista:fallback', 4, undefined, `artista:${s}`)))
        expect(outras.some(l => ids(l).join() !== a.join())).toBe(true)
    })
})

describe('getVitrineTematica', () => {
    it('com menos de 3 casamentos cai na vitrine geral', async () => {
        mocks.todos.mockResolvedValue([produto(1, 'Sérum', { category: 'kbeauty' })])
        mocks.destaques.mockResolvedValue([produto(9, 'Destaque')])
        expect(ids(await getVitrineTematica('rotina de skincare', 'artigo'))).toEqual([9])
    })

    it('mantém na frente o produto citado na página e completa com o tema, sem passar do limite', async () => {
        mocks.todos.mockResolvedValue([
            ...Array.from({ length: 6 }, (_, i) => produto(i + 1, `Item ${i + 1}`, { category: 'kbeauty' })),
            produto(7, 'Essência Cosrx', { category: 'kbeauty' }),
        ])
        const faixa = await getVitrineTematica('skincare com Cosrx', 'artigo', { limit: 3 })
        expect(faixa).toHaveLength(3)
        expect(faixa[0].id).toBe(7)
        expect(new Set(ids(faixa)).size).toBe(3)
        expect(mocks.destaques).not.toHaveBeenCalled()
    })
})

describe('getVitrineMaratona', () => {
    it('só traz comida e petisco com link, preço e imagem', async () => {
        mocks.todos.mockResolvedValue([
            produto(1, 'Lámen', { category: 'alimenta' }),
            produto(2, 'Pepero', { category: 'snacks' }),
            produto(3, 'Sérum', { category: 'kbeauty' }),
            produto(4, 'Sem foto', { category: 'snacks', image_url: '' }),
            produto(5, 'Sem link', { category: 'snacks', affiliate_url: '' }),
            produto(6, 'Escondido', { category: 'snacks', is_hidden: true }),
            produto(7, 'Sem preço', { category: 'alimenta', price: '' }),
        ])
        expect(ids(await getVitrineMaratona('serie')).sort()).toEqual([1, 2])
    })

    it('respeita o limite', async () => {
        mocks.todos.mockResolvedValue(Array.from({ length: 20 }, (_, i) => produto(i + 1, `Petisco ${i + 1}`, { category: 'snacks' })))
        expect(await getVitrineMaratona('serie', 4)).toHaveLength(4)
    })
})

describe('getPrateleiraDaObra', () => {
    it('ordena por vínculo: obra, elenco e maratona, com o motivo de cada um', async () => {
        mocks.todos.mockResolvedValue([
            produto(1, 'OST Round Six Deluxe'),
            produto(2, 'Lámen apimentado', { category: 'alimenta' }),
        ])
        mocks.porArtista.mockResolvedValue([produto(3, 'Photobook')])
        const r = await getPrateleiraDaObra({ tituloObra: 'Round Six', artistIds: [10], comidas: [], contexto: 'obra' })
        expect(ids(r.produtos)).toEqual([1, 3, 2])
        expect(r.motivos).toEqual({ 1: 'na-obra', 3: 'elenco', 2: 'maratona' })
    })

    it('consulta só os quatro primeiros artistas e intercala os produtos deles', async () => {
        mocks.porArtista.mockImplementation(async (id: number) => [produto(id * 10 + 1, 'A'), produto(id * 10 + 2, 'B')])
        const r = await getPrateleiraDaObra({ tituloObra: 'Obra qualquer', artistIds: [1, 2, 3, 4, 5], comidas: [], contexto: 'obra' })
        expect(mocks.porArtista.mock.calls.map(c => c[0])).toEqual([1, 2, 3, 4])
        expect(ids(r.produtos)).toEqual([11, 21, 31, 41, 12, 22])
    })

    it('põe o produto da comida da ficha como visto na obra', async () => {
        mocks.todos.mockResolvedValue([produto(1, 'Pasta Gochujang', { category: 'alimenta' })])
        const r = await getPrateleiraDaObra({ tituloObra: 'Obra qualquer', artistIds: [], comidas: ['Gochujang'], contexto: 'obra' })
        expect(r.motivos[1]).toBe('na-obra')
        expect(r.produtos).toHaveLength(1)
    })
})

describe('getVitrinePorTermos', () => {
    it('devolve só o que casa com os termos, até o limite', async () => {
        mocks.todos.mockResolvedValue([
            ...Array.from({ length: 5 }, (_, i) => produto(i + 1, `Kimchi tradicional ${i + 1}`)),
            produto(9, 'Photocard'),
        ])
        const r = await getVitrinePorTermos(['Kimchi'], 'comida')
        expect(r).toHaveLength(3)
        expect(ids(r)).not.toContain(9)
    })

    it('sem casamento não inventa prateleira', async () => {
        mocks.todos.mockResolvedValue([produto(1, 'Photocard')])
        expect(await getVitrinePorTermos(['Hyundai'], 'empresa')).toEqual([])
    })
})

describe('getVitrineVinculada', () => {
    it('prefere os produtos vinculados, respeitando o limite', async () => {
        mocks.porIds.mockResolvedValue([1, 2, 3, 4].map(i => produto(i, `Vinculado ${i}`)))
        expect(ids(await getVitrineVinculada([1, 2, 3, 4], ['x'], 'empresa'))).toEqual([1, 2, 3])
        expect(ids(await getVitrineVinculada([1, 2, 3, 4], ['x'], 'empresa', { limit: 2 }))).toEqual([1, 2])
        expect(mocks.todos).not.toHaveBeenCalled()
    })

    it('sem vínculo casa pelos termos', async () => {
        mocks.todos.mockResolvedValue([produto(5, 'Kimchi')])
        expect(ids(await getVitrineVinculada(undefined, ['Kimchi'], 'comida'))).toEqual([5])
        expect(mocks.porIds).toHaveBeenCalledWith([])
    })

    it('vinculado sem link não ocupa vaga na faixa', async () => {
        mocks.porIds.mockResolvedValue([
            produto(1, 'Sem link', { affiliate_url: '' }),
            produto(2, 'A'), produto(3, 'B'), produto(4, 'C'),
        ])
        expect(ids(await getVitrineVinculada([1, 2, 3, 4], ['x'], 'empresa'))).toEqual([2, 3, 4])
    })

    it('quando nenhum vinculado tem link, casa pelos termos', async () => {
        mocks.porIds.mockResolvedValue([produto(1, 'Sem link', { affiliate_url: '' })])
        mocks.todos.mockResolvedValue([produto(5, 'Kimchi')])
        expect(ids(await getVitrineVinculada([1], ['Kimchi'], 'comida'))).toEqual([5])
    })
})

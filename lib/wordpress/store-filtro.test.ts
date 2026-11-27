import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contarOfertasEQuedas, filtrarLoja, montarHref } from './store-filtro'
import type { StoreProduct } from './store'

function produto(id: number, titulo: string, acf: Partial<StoreProduct['acf']> = {}): StoreProduct {
    return {
        id,
        title: { rendered: titulo },
        date_gmt: '2026-11-01T00:00:00',
        acf: {
            price: null, original_price: null, image_url: null, affiliate_url: null,
            store: 'shopee', category: 'kpop_album', badge: null, rating: null, sold_count: null,
            featured: null, is_hidden: null, position: null, related_group: null, related_artist: null,
            price_history: null,
            ...acf,
        },
    }
}

/** Histórico em que o preço caiu: duas leituras dentro dos 30 dias, a maior em `de`. */
function historico(de: string, atual: string) {
    return [{ date: '2026-11-10', price: de }, { date: '2026-11-20', price: atual }]
}

const ids = (lista: StoreProduct[]) => lista.map(p => p.id)

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('filtrarLoja', () => {
    const catalogo = [
        produto(1, 'Lightstick BTS', { category: 'lightstick', store: 'shopee', price: 'R$ 100,00' }),
        produto(2, 'Álbum NewJeans', { category: 'kpop_album', store: 'amazon', price: 'R$ 80,00' }),
        produto(3, 'Máscara facial', { category: 'kbeauty', store: 'shopee', price: 'R$ 30,00' }),
    ]

    it('sem filtro devolve todos', () => {
        expect(ids(filtrarLoja(catalogo, {})).sort()).toEqual([1, 2, 3])
    })

    it('não altera a lista recebida', () => {
        const copia = [...catalogo]
        filtrarLoja(catalogo, { ordem: 'menor' })
        expect(catalogo).toEqual(copia)
    })

    it('filtra por categoria e por loja, e os dois somam', () => {
        expect(ids(filtrarLoja(catalogo, { categoria: 'kbeauty' }))).toEqual([3])
        expect(ids(filtrarLoja(catalogo, { loja: 'amazon' }))).toEqual([2])
        expect(filtrarLoja(catalogo, { categoria: 'kbeauty', loja: 'amazon' })).toEqual([])
    })

    it('busca pelo título sem diferenciar maiúsculas', () => {
        expect(ids(filtrarLoja(catalogo, { busca: 'LIGHTSTICK' }))).toEqual([1])
        expect(filtrarLoja(catalogo, { busca: 'inexistente' })).toEqual([])
    })

    it('ofertas=1 deixa só quem tem desconto real, do maior para o menor', () => {
        const lista = [
            produto(1, 'A', { price: 'R$ 90,00', original_price: 'R$ 100,00' }), // 10%
            produto(2, 'B', { price: 'R$ 50,00', original_price: 'R$ 100,00' }), // 50%
            produto(3, 'C', { price: 'R$ 100,00', original_price: 'R$ 100,00' }), // sem desconto
            produto(4, 'D', { price: 'R$ 70,00' }), // sem preço original
        ]
        expect(ids(filtrarLoja(lista, { ofertas: '1' }))).toEqual([2, 1])
    })

    it('queda=1 deixa só quem baixou de preço, da maior queda para a menor, e vence ofertas=1', () => {
        const lista = [
            produto(1, 'A', { price: 'R$ 90,00', original_price: 'R$ 200,00', price_history: historico('R$ 100,00', 'R$ 90,00') }), // queda 10%
            produto(2, 'B', { price: 'R$ 50,00', price_history: historico('R$ 100,00', 'R$ 50,00') }), // queda 50%
            produto(3, 'C', { price: 'R$ 100,00', price_history: historico('R$ 100,00', 'R$ 100,00') }), // parado
        ]
        expect(ids(filtrarLoja(lista, { queda: '1' }))).toEqual([2, 1])
        // com os dois ligados vale a queda: o 2 não tem desconto de oferta, mas continua na lista
        expect(ids(filtrarLoja(lista, { queda: '1', ofertas: '1' }))).toEqual([2, 1])
    })

    it('ordem=menor e ordem=maior vencem a ordem de ofertas, e produto sem preço vai para o fim', () => {
        const lista = [
            produto(1, 'A', { price: 'R$ 100,00', original_price: 'R$ 200,00' }), // 50%
            produto(2, 'B', { price: 'sob consulta' }),
            produto(3, 'C', { price: 'R$ 20,00', original_price: 'R$ 22,00' }), // 9%
            produto(4, 'D', { price: null }),
        ]
        expect(ids(filtrarLoja(lista, { ordem: 'menor' })).slice(0, 2)).toEqual([3, 1])
        expect(ids(filtrarLoja(lista, { ordem: 'maior' })).slice(0, 2)).toEqual([1, 3])
        expect(ids(filtrarLoja(lista, { ordem: 'menor' })).slice(2).sort()).toEqual([2, 4])
        expect(ids(filtrarLoja(lista, { ordem: 'maior' })).slice(2).sort()).toEqual([2, 4])
        // ofertas sozinha poria o 1 (50%) antes do 3 (9%); com ordem=menor o preço decide
        expect(ids(filtrarLoja(lista, { ofertas: '1', ordem: 'menor' }))).toEqual([3, 1])
    })

    it('ordem desconhecida é ignorada', () => {
        expect(ids(filtrarLoja(catalogo, { ordem: 'qualquer' })).sort()).toEqual([1, 2, 3])
    })
})

describe('contarOfertasEQuedas', () => {
    it('conta só desconto real e queda real', () => {
        const lista = [
            produto(1, 'A', { price: 'R$ 50,00', original_price: 'R$ 100,00' }),
            produto(2, 'B', { price: 'R$ 50,00', price_history: historico('R$ 100,00', 'R$ 50,00') }),
            produto(3, 'C', { price: 'R$ 50,00', original_price: 'R$ 40,00' }), // "original" menor: sem desconto
            produto(4, 'D'),
        ]
        expect(contarOfertasEQuedas(lista)).toEqual({ totalOfertas: 1, totalQuedas: 1 })
    })

    it('lista vazia dá zero', () => {
        expect(contarOfertasEQuedas([])).toEqual({ totalOfertas: 0, totalQuedas: 0 })
    })
})

describe('montarHref', () => {
    it('sem nenhum filtro e valor vazio volta para /loja', () => {
        expect(montarHref({}, 'categoria', '')).toBe('/loja')
    })

    it('liga um filtro', () => {
        expect(montarHref({}, 'categoria', 'kbeauty')).toBe('/loja?categoria=kbeauty')
    })

    it('troca o filtro da própria chave e preserva os outros e a busca', () => {
        const params = { categoria: 'kbeauty', loja: 'shopee', busca: 'máscara', ordem: 'menor' }
        const href = new URL(montarHref(params, 'categoria', 'lightstick'), 'https://x.test')
        expect(href.pathname).toBe('/loja')
        expect(Object.fromEntries(href.searchParams)).toEqual({
            categoria: 'lightstick', loja: 'shopee', busca: 'máscara', ordem: 'menor',
        })
    })

    it('valor vazio remove só a chave pedida', () => {
        const params = { categoria: 'kbeauty', loja: 'shopee', busca: 'x' }
        const href = new URL(montarHref(params, 'categoria', ''), 'https://x.test')
        expect(Object.fromEntries(href.searchParams)).toEqual({ loja: 'shopee', busca: 'x' })
    })

    it('ofertas e queda só sobrevivem quando valem 1', () => {
        const href = new URL(montarHref({ ofertas: '1', queda: '0' }, 'loja', 'amazon'), 'https://x.test')
        expect(Object.fromEntries(href.searchParams)).toEqual({ ofertas: '1', loja: 'amazon' })
    })

    it('a busca nunca sai, mesmo mexendo em outra chave', () => {
        expect(montarHref({ busca: 'bts' }, 'ordem', 'maior')).toBe('/loja?busca=bts&ordem=maior')
    })

    it('codifica caracteres especiais da busca', () => {
        expect(montarHref({ busca: 'k&b #1' }, 'loja', '')).toBe('/loja?busca=k%26b+%231')
    })
})

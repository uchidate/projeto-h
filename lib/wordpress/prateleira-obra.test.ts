import { describe, expect, it } from 'vitest'
import { alternarFamilias, citaAObra, montarPrateleiraDaObra, tituloPrateleira } from './prateleira-obra'
import type { StoreProduct } from './store'

const produto = (id: number, titulo = `Produto ${id}`, acf: Partial<StoreProduct['acf']> = {}) =>
    ({ id, title: { rendered: titulo }, acf: { affiliate_url: 'https://x', ...acf } }) as unknown as StoreProduct

describe('montarPrateleiraDaObra', () => {
    it('ordena por vínculo com a obra e guarda o primeiro motivo', () => {
        const r = montarPrateleiraDaObra({ naObra: [produto(1)], elenco: [produto(2), produto(1)], maratona: [produto(3), produto(4)] }, 3)
        expect(r.produtos.map(p => p.id)).toEqual([1, 2, 3])
        expect(r.motivos).toEqual({ 1: 'na-obra', 2: 'elenco', 3: 'maratona' })
    })

    it('pula produto sem link de afiliado ou oculto', () => {
        const r = montarPrateleiraDaObra({ naObra: [produto(1, 'a', { affiliate_url: null }), produto(2, 'b', { is_hidden: true })], elenco: [], maratona: [produto(3)] })
        expect(r.produtos.map(p => p.id)).toEqual([3])
    })
})

describe('tituloPrateleira', () => {
    it('título pelo motivo único; mistura vira "Para maratonar"', () => {
        expect(tituloPrateleira('Vincenzo', ['na-obra', 'na-obra'])).toBe('Visto em Vincenzo')
        expect(tituloPrateleira('Vincenzo', ['elenco'])).toBe('Do elenco de Vincenzo')
        expect(tituloPrateleira('Vincenzo', ['na-obra', 'maratona'])).toBe('Para maratonar Vincenzo')
        expect(tituloPrateleira('Vincenzo', [])).toBe('Para maratonar Vincenzo')
    })
})

describe('citaAObra', () => {
    it('casa o título inteiro, sem acento nem caixa', () => {
        expect(citaAObra(produto(1, 'OST de Pousando no Amor (CD)'), 'Pousando no Amor')).toBe(true)
        expect(citaAObra(produto(1, 'Kit Stray Kids'), 'ONE: High School Heroes')).toBe(false)
    })

    it('ignora título curto e palavra dentro de outra', () => {
        expect(citaAObra(produto(1, 'Lámen Shin Ramyun'), 'Shin')).toBe(false)
        expect(citaAObra(produto(1, 'Goblin Slayer mangá'), 'Goblins Slayer')).toBe(false)
    })
})

describe('alternarFamilias', () => {
    it('não deixa dois lámens seguidos quando há outro tipo', () => {
        const lista = [produto(1, 'Shin Ramyun'), produto(2, 'Jin Ramen'), produto(3, 'Choco Pie Lotte'), produto(4, 'Gochujang 500g')]
        expect(alternarFamilias(lista).map(p => p.id)).toEqual([1, 3, 4, 2])
    })
})

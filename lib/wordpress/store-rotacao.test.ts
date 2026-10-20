import { describe, expect, it } from 'vitest'
import { sortearPrateleira } from './store-rotacao'
import type { StoreProduct } from './store'

const prod = (id: number, extra: Partial<StoreProduct['acf']> = {}): StoreProduct => ({
    id, title: { rendered: `P${id}` }, date_gmt: '2026-10-01T00:00:00',
    acf: { price: 'R$ 10,00', original_price: null, image_url: 'x', affiliate_url: 'x', store: 'mercadolivre', category: null, badge: null, rating: null, sold_count: null, featured: false, is_hidden: false, position: 50, related_group: null, related_artist: null, price_history: null, ...extra },
})
const lista = Array.from({ length: 10 }, (_, i) => prod(i + 1))

// Gerador determinístico (LCG) para o teste não depender de sorte.
const semente = (n: number) => () => (n = (n * 1664525 + 1013904223) % 4294967296) / 4294967296

describe('sortearPrateleira', () => {
    it('devolve a quantidade pedida, sem repetir, na ordem de aderência', () => {
        const r = sortearPrateleira(lista, 5, new Set(), semente(1))
        expect(r).toHaveLength(5)
        expect(new Set(r.map(p => p.id)).size).toBe(5)
        expect(r.map(p => p.id)).toEqual([...r.map(p => p.id)].sort((a, b) => a - b))
    })

    it('varia entre visualizações, mas o mais aderente aparece mais que o último', () => {
        const contagem = new Map<number, number>()
        const distintos = new Set<string>()
        for (let s = 1; s <= 400; s++) {
            const r = sortearPrateleira(lista, 5, new Set(), semente(s * 7919))
            distintos.add(r.map(p => p.id).join(','))
            for (const p of r) contagem.set(p.id, (contagem.get(p.id) ?? 0) + 1)
        }
        expect(distintos.size).toBeGreaterThan(20)
        expect(contagem.get(1)!).toBeGreaterThan(contagem.get(10)!)
        expect(contagem.get(10)!).toBeGreaterThan(0)
    })

    it('destaque não fica fixo: há visualizações sem ele', () => {
        const com = [prod(1, { featured: true }), ...lista.slice(1)]
        const semDestaque = Array.from({ length: 300 }, (_, s) => sortearPrateleira(com, 5, new Set(), semente(s + 3))).filter(r => !r.some(p => p.id === 1))
        expect(semDestaque.length).toBeGreaterThan(0)
    })

    it('o que o visitante viu há pouco aparece menos', () => {
        const conta = (vistos: Set<number>) => Array.from({ length: 400 }, (_, s) => sortearPrateleira(lista, 5, vistos, semente(s + 11))).filter(r => r.some(p => p.id === 1)).length
        expect(conta(new Set([1]))).toBeLessThan(conta(new Set()))
    })
})

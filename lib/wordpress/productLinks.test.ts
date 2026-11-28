import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({ empresas: vi.fn(), comidas: vi.fn() }))
vi.mock('./companies', () => ({ getCompanies: m.empresas }))
vi.mock('./foods', () => ({ getFoods: m.comidas }))

import { getProductLinksMap } from './productLinks'

const ficha = (slug: string, ids?: number[]) => ({ slug, title: { rendered: `<b>${slug}</b>` }, acf: ids ? { linked_products: ids } : undefined })

describe('getProductLinksMap', () => {
    beforeEach(() => { m.empresas.mockReset(); m.comidas.mockReset() })

    it('percorre todas as páginas e a empresa vence a comida no mesmo produto', async () => {
        m.empresas.mockImplementation(async ({ page = 1 }) => ({ items: page === 1 ? [ficha('lg', [1])] : [ficha('kia', [2, 1]), ficha('sem')], totalPages: 2 }))
        m.comidas.mockImplementation(async ({ page = 1 }) => ({ items: page === 1 ? [ficha('kimchi', [2, 3])] : [ficha('bibimbap', [4, 3]), ficha('vazia')], totalPages: 2 }))
        const mapa = await getProductLinksMap()
        expect(m.empresas).toHaveBeenCalledTimes(2)
        expect(m.comidas).toHaveBeenCalledTimes(2)
        expect([...mapa.entries()].sort(([a], [b]) => a - b)).toEqual([
            [1, { type: 'company', slug: 'lg', title: 'lg' }],
            [2, { type: 'company', slug: 'kia', title: 'kia' }],
            [3, { type: 'food', slug: 'kimchi', title: 'kimchi' }],
            [4, { type: 'food', slug: 'bibimbap', title: 'bibimbap' }],
        ])
    })
})

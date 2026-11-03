import { describe, it, expect } from 'vitest'
import { idsGuiaDeCompra } from './guiasDeCompra'

describe('idsGuiaDeCompra', () => {
    it('pega só as categorias de guia de compra', () => {
        const cats = [
            { id: 1, slug: 'k-pop' }, { id: 2, slug: 'k-beauty' }, { id: 3, slug: 'cultura' },
            { id: 4, slug: 'merch' }, { id: 5, slug: 'comida' }, { id: 6, slug: 'noticias-k-pop' },
        ]
        expect(idsGuiaDeCompra(cats)).toEqual([2, 4, 5])
    })
    it('devolve lista vazia sem categorias', () => {
        expect(idsGuiaDeCompra([])).toEqual([])
    })
})

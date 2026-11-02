import { describe, it, expect } from 'vitest'
import type { StoreProduct } from '@/lib/wordpress/store'
import type { WPCompany } from '@/lib/wordpress/types'
import { marcasComProdutos, produtosDaCategoria, CATEGORIAS_COM_LOJA } from './categoriaLoja'

const produto = (id: number, titulo: string, extra: Partial<StoreProduct['acf']> = {}): StoreProduct => ({
    id, title: { rendered: titulo }, date_gmt: '2026-01-01T00:00:00',
    acf: { price: 'R$ 50,00', original_price: null, image_url: 'x.jpg', affiliate_url: 'https://s.shopee.com.br/a', store: 'shopee', category: 'kbeauty', badge: null, rating: null, sold_count: null, featured: null, is_hidden: null, position: null, related_group: null, related_artist: null, price_history: null, ...extra },
})
const empresa = (slug: string, nome: string, logo: string | null = null, marcas: string[] = []): WPCompany =>
    ({ id: 1, slug, title: { rendered: nome }, featured_image_url: logo, acf: { global_brands: marcas } }) as unknown as WPCompany

describe('produtosDaCategoria', () => {
    it('descarta oculto, sem link, sem preço e de outra categoria', () => {
        const lista = [
            produto(1, 'Ok'),
            produto(2, 'Oculto', { is_hidden: true }),
            produto(3, 'Sem link', { affiliate_url: null }),
            produto(4, 'Sem preço', { price: null }),
            produto(5, 'Outra', { category: 'photocard' }),
        ]
        expect(produtosDaCategoria(lista, ['kbeauty']).map(p => p.id)).toEqual([1])
    })
})

describe('marcasComProdutos', () => {
    const produtos = [
        produto(1, 'Celimax Retinal Shot 15ml'),
        produto(2, 'Celimax Noni Ampola'),
        produto(3, 'Dr.Althea Creme 345'),
        produto(4, 'rom&nd Juicy Lasting Tint'),
    ]
    it('conta produtos por marca, mais produtos primeiro', () => {
        const r = marcasComProdutos([empresa('dr-althea', 'Dr.Althea'), empresa('celimax', 'Celimax', 'l.png')], produtos)
        expect(r.map(m => [m.slug, m.produtos])).toEqual([['celimax', 2], ['dr-althea', 1]])
        expect(r[0].logo).toBe('l.png')
    })
    it('casa nome com pontuação e entidade HTML', () => {
        const r = marcasComProdutos([empresa('romand', 'rom&#038;nd')], produtos)
        expect(r.map(m => m.slug)).toEqual(['romand'])
    })
    it('usa global_brands e ignora marca sem produto ou nome curto', () => {
        const r = marcasComProdutos([empresa('amore', 'Amorepacific', null, ['Celimax']), empresa('lg', 'LG'), empresa('x', 'Sem Produto')], produtos)
        expect(r.map(m => m.slug)).toEqual(['amore'])
    })
    it('marca com ficha própria não conta para a empresa que a lista', () => {
        const r = marcasComProdutos([empresa('medicube', 'Medicube', null, ['Celimax']), empresa('celimax', 'Celimax')], produtos)
        expect(r.map(m => [m.slug, m.produtos])).toEqual([['celimax', 2]])
    })
    it('só casa palavra inteira', () => {
        expect(marcasComProdutos([empresa('max', 'Celi')], produtos)).toEqual([])
    })
})

it('k-beauty liga a kbeauty e beauty; comida liga snacks e alimenta', () => {
    expect(CATEGORIAS_COM_LOJA['k-beauty']).toMatchObject({ categoriasLoja: ['kbeauty'], industria: 'beauty' })
    expect(CATEGORIAS_COM_LOJA['comida']).toMatchObject({ categoriasLoja: ['snacks', 'alimenta'], industria: 'food_beverage' })
})

it('merch liga lightstick, photocard e álbum, sem setor de marcas', () => {
    expect(CATEGORIAS_COM_LOJA['merch']).toMatchObject({ categoriasLoja: ['lightstick', 'photocard', 'kpop_album'] })
    expect(CATEGORIAS_COM_LOJA['merch'].industria).toBeUndefined()
})

it('produtosDaCategoria aceita mais de uma categoria de loja', () => {
    const lista = [produto(1, 'A', { category: 'snacks' }), produto(2, 'B', { category: 'alimenta' }), produto(3, 'C', { category: 'kbeauty' })]
    expect(produtosDaCategoria(lista, ['snacks', 'alimenta']).map(p => p.id)).toEqual([1, 2])
})

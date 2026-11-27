// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { StoreProduct } from '@/lib/wordpress/store'

const { getStoreProducts, getGroupsByIds, getProductLinksMap } = vi.hoisted(() => ({
    getStoreProducts: vi.fn(),
    getGroupsByIds: vi.fn(),
    getProductLinksMap: vi.fn(),
}))

vi.mock('@/lib/wordpress/store', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/wordpress/store')>()),
    getStoreProducts,
}))
// Sem ranking de cliques: a ordem sai só dos critérios fixos (preço, destaque, desconto, posição).
vi.mock('@/lib/wordpress/ranking-remoto', () => ({
    rankingRemoto: () => ({ neutro: 0, global: {}, porContexto: {} }),
    parseRanking: () => null,
    garantirRankingRemoto: async () => {},
}))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByIds }))
vi.mock('@/lib/wordpress/productLinks', () => ({ getProductLinksMap }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a>,
}))
vi.mock('@/components/ui/StoreCard', () => ({
    StoreCard: ({ product, contexto }: { product: StoreProduct; contexto: string }) => <div data-testid="card" data-id={product.id} data-contexto={contexto} />,
}))
vi.mock('@/components/ui/LojaClique', () => ({
    LojaClique: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} data-testid="mosaico">{children}</a>,
}))
vi.mock('@/components/ui/VitrineVista', () => ({
    VitrineVista: ({ children, contexto }: { children: React.ReactNode; contexto: string }) => <div data-vitrine={contexto}>{children}</div>,
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { LojaListagem, metadataLoja, type SearchParams } from './LojaListagem'

let proximoId = 1
function produto(acf: Partial<StoreProduct['acf']> = {}, titulo = 'Produto'): StoreProduct {
    const id = proximoId++
    return {
        id,
        date_gmt: '2026-01-01T00:00:00',
        title: { rendered: `${titulo} ${id}` },
        acf: {
            price: 'R$ 100,00', original_price: null, image_url: null, affiliate_url: `https://loja.test/${id}`, store: 'shopee',
            category: 'kpop_album', badge: null, rating: null, sold_count: null, featured: false, is_hidden: false,
            position: null, related_group: null, related_artist: null, price_history: null, ...acf,
        },
    }
}

async function montar(params: Awaited<SearchParams> = {}) {
    const el = await LojaListagem({ searchParams: Promise.resolve(params) })
    return render(el)
}
const ids = () => screen.getAllByTestId('card').map((c) => Number((c as HTMLElement).dataset.id))
const hrefDe = (texto: string | RegExp) => screen.getByRole('link', { name: texto }).getAttribute('href')
const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

describe('LojaListagem', () => {
    beforeEach(() => {
        proximoId = 1
        getStoreProducts.mockReset().mockResolvedValue([])
        getGroupsByIds.mockReset().mockResolvedValue([])
        getProductLinksMap.mockReset().mockResolvedValue(new Map())
    })

    it('metadados: canônica /loja', () => {
        expect(metadataLoja.alternates?.canonical).toMatch(/\/loja$/)
        expect(metadataLoja.title).toBe('Loja K-Pop')
    })

    it('sem produtos, mostra o aviso "Em breve" e nenhum cartão', async () => {
        await montar()
        expect(screen.getByText(/Em breve: produtos selecionados/)).toBeTruthy()
        expect(screen.queryAllByTestId('card')).toHaveLength(0)
    })

    it('produto oculto não conta nem aparece', async () => {
        getStoreProducts.mockResolvedValue([produto(), produto({ is_hidden: true }), produto()])
        await montar()
        expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('2 produtos')
        expect(ids()).not.toContain(2)
    })

    it('sem filtro, agrupa por categoria e mostra a categoria maior primeiro', async () => {
        getStoreProducts.mockResolvedValue([
            produto({ category: 'lightstick' }),
            produto({ category: 'kbeauty' }), produto({ category: 'kbeauty' }),
        ])
        await montar()
        const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
        expect(titulos).toEqual(['K-Beauty', 'Lightsticks'])
        expect(document.getElementById('categoria-kbeauty')).toBeTruthy()
    })

    it('"Escolhas da curadoria" só com destaque e só sem filtro ativo', async () => {
        getStoreProducts.mockResolvedValue([produto({ featured: true }), produto()])
        const { unmount } = await montar()
        expect(screen.getByRole('heading', { name: 'Escolhas da curadoria' })).toBeTruthy()
        unmount()
        await montar({ categoria: 'kpop_album' })
        expect(screen.queryByRole('heading', { name: 'Escolhas da curadoria' })).toBeNull()
    })

    it('mosaico de destaques mostra o desconto real', async () => {
        getStoreProducts.mockResolvedValue([produto({ featured: true, price: 'R$ 50,00', original_price: 'R$ 100,00' })])
        await montar()
        expect(within(screen.getByTestId('mosaico')).getByText('-50%')).toBeTruthy()
    })

    it('faixa "Por grupo" aparece com 3 grupos que têm 3+ produtos cada, e some com filtro', async () => {
        const produtos = [10, 20, 30].flatMap((g) => [1, 2, 3].map(() => produto({ related_group: g })))
        getStoreProducts.mockResolvedValue(produtos)
        getGroupsByIds.mockResolvedValue([10, 20, 30].map((id) => ({ id, slug: `grupo-${id}`, title: { rendered: `Grupo ${id}` } })))
        const { unmount } = await montar()
        expect(screen.getByRole('navigation', { name: 'Produtos por grupo' })).toBeTruthy()
        expect(hrefDe(/Grupo 10/)).toBe('/loja/grupo/grupo-10')
        unmount()
        await montar({ busca: 'produto' })
        expect(screen.queryByRole('navigation', { name: 'Produtos por grupo' })).toBeNull()
    })

    it('grupo com menos de 3 produtos fica fora da faixa e nem consulta o WordPress', async () => {
        getStoreProducts.mockResolvedValue([produto({ related_group: 5 }), produto({ related_group: 5 })])
        await montar()
        expect(getGroupsByIds).not.toHaveBeenCalled()
    })

    it('se a busca de grupos falhar, a loja renderiza sem a faixa', async () => {
        const produtos = [10, 20, 30].flatMap((g) => [1, 2, 3].map(() => produto({ related_group: g })))
        getStoreProducts.mockResolvedValue(produtos)
        getGroupsByIds.mockRejectedValue(new Error('WP fora'))
        await montar()
        expect(screen.queryByRole('navigation', { name: 'Produtos por grupo' })).toBeNull()
        expect(screen.getAllByTestId('card').length).toBeGreaterThan(0)
    })

    it('filtra por categoria e por loja, com contagem no singular e no plural', async () => {
        getStoreProducts.mockResolvedValue([
            produto({ category: 'kbeauty', store: 'amazon' }),
            produto({ category: 'kbeauty', store: 'shopee' }),
            produto({ category: 'lightstick', store: 'shopee' }),
        ])
        const { unmount } = await montar({ categoria: 'kbeauty' })
        expect(screen.getByText('2 produtos encontrados')).toBeTruthy()
        unmount()
        await montar({ categoria: 'kbeauty', loja: 'amazon' })
        expect(screen.getByText('1 produto encontrado')).toBeTruthy()
        expect(ids()).toEqual([1])
    })

    it('busca pelo título, sem diferenciar maiúsculas, e avisa quando não acha nada', async () => {
        getStoreProducts.mockResolvedValue([produto({}, 'Lightstick Oficial'), produto({}, 'Máscara')])
        const { unmount } = await montar({ busca: 'LIGHTSTICK' })
        expect(ids()).toEqual([1])
        unmount()
        await montar({ busca: 'inexistente' })
        expect(screen.getByText('Nenhum produto encontrado.')).toBeTruthy()
    })

    it('ofertas=1 mostra só produto com desconto real, do maior para o menor', async () => {
        getStoreProducts.mockResolvedValue([
            produto({ price: 'R$ 90,00', original_price: 'R$ 100,00' }),
            produto(),
            produto({ price: 'R$ 50,00', original_price: 'R$ 100,00' }),
        ])
        await montar({ ofertas: '1' })
        expect(ids()).toEqual([3, 1])
    })

    it('queda=1 mostra só produto que baixou de preço, da maior queda para a menor', async () => {
        const historico = (maior: string) => [{ date: diasAtras(10), price: maior }, { date: diasAtras(2), price: maior }]
        getStoreProducts.mockResolvedValue([
            produto({ price: 'R$ 90,00', price_history: historico('R$ 100,00') }),
            produto({ price: 'R$ 100,00', price_history: historico('R$ 100,00') }),
            produto({ price: 'R$ 60,00', price_history: historico('R$ 100,00') }),
        ])
        await montar({ queda: '1' })
        expect(ids()).toEqual([3, 1])
    })

    it('ordem por preço vence a ordem do filtro e manda produto sem preço para o fim', async () => {
        getStoreProducts.mockResolvedValue([
            produto({ price: 'R$ 30,00' }),
            produto({ price: null }),
            produto({ price: 'R$ 1.200,00' }),
            produto({ price: 'R$ 5,50' }),
        ])
        const { unmount } = await montar({ busca: 'produto', ordem: 'menor' })
        expect(ids()).toEqual([4, 1, 3, 2])
        unmount()
        await montar({ busca: 'produto', ordem: 'maior' })
        expect(ids()).toEqual([3, 1, 4, 2])
    })

    it('os links de filtro preservam os outros filtros e o campo de busca', async () => {
        getStoreProducts.mockResolvedValue([produto({ category: 'kbeauty', store: 'amazon' }), produto({ category: 'lightstick', store: 'shopee' })])
        await montar({ categoria: 'kbeauty', loja: 'amazon', busca: 'produto', ordem: 'menor' })
        expect(hrefDe('Todos')).toBe('/loja?loja=amazon&busca=produto&ordem=menor')
        expect(hrefDe(/^Todas$/)).toBe('/loja?categoria=kbeauty&busca=produto&ordem=menor')
        expect(hrefDe('Relevância')).toBe('/loja?categoria=kbeauty&loja=amazon&busca=produto')
    })

    it('"Limpar" e os campos ocultos do formulário só existem com filtro ativo', async () => {
        getStoreProducts.mockResolvedValue([produto()])
        const { unmount, container } = await montar()
        expect(screen.queryByText('Limpar')).toBeNull()
        unmount()
        const filtrado = await montar({ categoria: 'kpop_album', ofertas: '1', ordem: 'menor' })
        expect(screen.getByText('Limpar').getAttribute('href')).toBe('/loja')
        const ocultos = Array.from(filtrado.container.querySelectorAll('input[type="hidden"]')).map((i) => (i as HTMLInputElement).name)
        expect(ocultos).toEqual(['categoria', 'ofertas', 'ordem'])
        expect(container).toBeTruthy()
    })

    it('categoria longa mostra 12 cartões e o link "Ver todos os N"', async () => {
        getStoreProducts.mockResolvedValue(Array.from({ length: 13 }, () => produto()))
        await montar()
        const secao = document.getElementById('categoria-kpop_album') as HTMLElement
        expect(within(secao).getAllByTestId('card')).toHaveLength(12)
        const ver = within(secao).getByRole('link', { name: /Ver todos os 13 de Álbuns K-Pop/ })
        expect(ver.getAttribute('href')).toBe('/loja?categoria=kpop_album')
        expect(ver.className).not.toContain('sm:hidden')
    })

    it('categoria de 7 a 12 produtos só ganha o link "Ver todos" no celular', async () => {
        getStoreProducts.mockResolvedValue(Array.from({ length: 8 }, () => produto()))
        await montar()
        const ver = screen.getByRole('link', { name: /Ver todos os 8/ })
        expect(ver.className).toContain('sm:hidden')
    })

    it('categoria curta (até 6) não tem link "Ver todos"', async () => {
        getStoreProducts.mockResolvedValue(Array.from({ length: 4 }, () => produto()))
        await montar()
        expect(screen.queryByRole('link', { name: /Ver todos/ })).toBeNull()
    })

    it('os botões de Ofertas e Baixou de preço aparecem só quando há produto para eles', async () => {
        getStoreProducts.mockResolvedValue([produto()])
        const { unmount } = await montar()
        expect(screen.queryByText(/Ofertas \(/)).toBeNull()
        expect(screen.queryByText(/Baixou de preço/)).toBeNull()
        unmount()
        getStoreProducts.mockResolvedValue([produto({ price: 'R$ 50,00', original_price: 'R$ 100,00' })])
        await montar()
        expect(screen.getByText(/Ofertas \(1\)/)).toBeTruthy()
    })
})

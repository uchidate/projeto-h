// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'
import type { ComponentProps } from 'react'

// Cobre o que a página de produções decide: faixas de descoberta só no início sem filtro, "Em alta" sem
// repetir na grade, anúncio entre fatias de 12, links que preservam filtros, "ver mais" e o que muda em outro idioma.
const ads = vi.hoisted(() => ({
    ADSENSE: { slots: { leaderboard: 'lb' as string | undefined, inline: 'in' as string | undefined } },
}))

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/config/ads', () => ads)
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({ default: (p: { src: string }) => <span data-img data-src={p.src} /> }))
vi.mock('@/components/artists/lista/ContinueDeOndeParou', () => ({ ContinueDeOndeParou: () => <div data-continue /> }))
vi.mock('@/components/ui/SearchInput', () => ({ SearchInput: (p: { current?: string }) => <input data-busca defaultValue={p.current ?? ''} /> }))
vi.mock('@/components/ui/Pagination', () => ({
    Pagination: (p: { currentPage: number; totalPages: number; buildHref: (n: number) => string }) => (
        <nav data-paginacao data-atual={p.currentPage} data-total={p.totalPages} data-href3={p.buildHref(3)} />
    ),
}))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: (p: { analyticsPlacement: string }) => <div data-anuncio={p.analyticsPlacement} /> }))
vi.mock('@/components/productions/ProductionsFilterSelects', () => ({ ProductionsFilterSelects: () => <div data-selects /> }))
vi.mock('@/components/productions/ProductionCard', () => ({
    ProductionCard: (p: { production: { id: number }; variant?: string; priority?: boolean }) => (
        <article data-card data-id={p.production.id} data-variante={p.variant ?? 'padrao'} data-prioridade={String(!!p.priority)} />
    ),
}))
vi.mock('@/components/ui/EmptyState', () => ({ EmptyState: (p: { description: string }) => <div data-vazio data-descricao={p.description} /> }))
vi.mock('@/components/analytics/RastreioDeFiltros', () => ({ RastreioDeFiltros: () => null }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({ ShopRelatedSection: () => <div data-loja /> }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))

import { ProductionsPage } from './ProductionsPage'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Props = ComponentProps<typeof ProductionsPage>
let seq = 0
const prod = (): Props['productions'][number] => ({ id: ++seq, slug: `p-${seq}` }) as unknown as Props['productions'][number]
const prods = (n: number) => Array.from({ length: n }, prod)
const termo = (id: number, slug: string) => ({ id, slug, name: slug.toUpperCase() }) as unknown as Props['genres'][number]

async function montar(extra: Partial<Props> = {}) {
    const lista = extra.productions ?? prods(30)
    return render(await ProductionsPage({
        productions: lista, total: lista.length, totalPages: 1, genres: [termo(1, 'romance')], platforms: [termo(2, 'netflix')],
        currentPage: 1, ...extra,
    }))
}

const ids = (el: Element, seletor: string) => [...el.querySelectorAll(seletor)].map((n) => Number(n.getAttribute('data-id')))
const hrefs = (el: Element | null) => [...(el?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'))
const bloco = (el: Element, nome: string) => el.querySelector(`[data-bloco="${nome}"]`)

beforeEach(() => {
    seq = 0
    ads.ADSENSE.slots.leaderboard = 'lb'
    ads.ADSENSE.slots.inline = 'in'
})
afterEach(cleanup)

describe('ProductionsPage — início sem filtro', () => {
    it('mostra as faixas de descoberta, o "continue de onde parou", o quiz e a vitrine', async () => {
        const { container } = await montar({
            emAlta: prods(3), plataformasTop: [termo(2, 'netflix')], generosTop: [{ slug: 'romance', nome: 'Romance', fotos: [] }],
            shopProducts: [{ id: 1 } as never],
        })
        expect(container.querySelector('[data-continue]')).not.toBeNull()
        for (const b of ['lista-em-alta', 'lista-plataformas', 'lista-generos']) expect(bloco(container, b)).not.toBeNull()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
        expect(container.querySelector('[data-loja]')).not.toBeNull()
        expect(container.querySelector('[data-anuncio="productions_leaderboard"]')).not.toBeNull()
    })

    it('"Em alta" mostra no máximo 16 com a posição e a grade segue dali, sem repetir', async () => {
        const lista = prods(30)
        const { container } = await montar({ productions: lista, emAlta: lista.slice(0, 20) })
        const alta = bloco(container, 'lista-em-alta')!
        expect(ids(alta, '[data-card]')).toHaveLength(16)
        expect([...alta.querySelectorAll('li')].map((li) => li.getAttribute('data-posicao')).slice(0, 2)).toEqual(['1', '2'])
        expect(alta.textContent).toContain('01')
        const grade = ids(bloco(container, 'lista-todas')!, '[data-card]')
        expect(grade).toEqual(lista.slice(16).map((p) => p.id))
    })

    it('sem "Em alta" a grade mostra tudo', async () => {
        const { container } = await montar({ productions: prods(10) })
        expect(ids(container, '[data-bloco="listagem-producoes"] [data-card]')).toHaveLength(10)
        expect(bloco(container, 'lista-em-alta')).toBeNull()
    })

    it('só as 3 primeiras de "Em alta" têm prioridade de carregamento', async () => {
        const { container } = await montar({ emAlta: prods(5) })
        const prioridades = [...bloco(container, 'lista-em-alta')!.querySelectorAll('[data-card]')].map((c) => c.getAttribute('data-prioridade'))
        expect(prioridades).toEqual(['true', 'true', 'true', 'false', 'false'])
    })

    it('plataformas: no máximo 6, com link que filtra e volta à página 1', async () => {
        const plataformas = Array.from({ length: 8 }, (_, i) => termo(10 + i, `plat-${i}`))
        const { container } = await montar({ plataformasTop: plataformas, currentPage: 1 })
        const links = hrefs(bloco(container, 'lista-plataformas'))
        expect(links).toHaveLength(6)
        expect(links[0]).toBe('/productions?platform=plat-0')
    })

    it('gêneros: link que filtra e no máximo 3 capas por gênero', async () => {
        const fotos = prods(5).map((p) => ({ ...p, featured_image_url: `/f${p.id}.jpg` })) as never
        const { container } = await montar({ generosTop: [{ slug: 'romance', nome: 'Romance', fotos }] })
        const faixa = bloco(container, 'lista-generos')!
        expect(hrefs(faixa)).toEqual(['/productions?genre=romance'])
        expect(faixa.querySelectorAll('[data-img]')).toHaveLength(3)
    })

    it('sem slot de anúncio, não há leaderboard', async () => {
        ads.ADSENSE.slots.leaderboard = undefined
        const { container } = await montar()
        expect(container.querySelector('[data-anuncio="productions_leaderboard"]')).toBeNull()
    })
})

describe('ProductionsPage — onde as faixas somem', () => {
    const casos: [string, Partial<Props>][] = [
        ['página 2', { currentPage: 2, totalPages: 3 }],
        ['busca', { search: 'crash' }],
        ['tipo', { currentType: 'drama' }],
        ['gênero', { currentGenre: 'romance' }],
        ['plataforma', { currentPlatform: 'netflix' }],
        ['ordem diferente de em alta', { currentOrder: 'recent' }],
    ]
    it.each(casos)('com %s não aparecem as faixas, o quiz nem a vitrine', async (_nome, extra) => {
        const { container } = await montar({
            emAlta: prods(3), plataformasTop: [termo(2, 'netflix')], generosTop: [{ slug: 'romance', nome: 'Romance', fotos: [] }],
            shopProducts: [{ id: 1 } as never], ...extra,
        })
        for (const b of ['lista-em-alta', 'lista-plataformas', 'lista-generos']) expect(bloco(container, b)).toBeNull()
        for (const s of ['[data-continue]', '[data-quiz]', '[data-loja]', '[data-anuncio="productions_leaderboard"]']) expect(container.querySelector(s)).toBeNull()
    })

    it('com filtro a grade não perde os 16 primeiros e os 2 primeiros ganham prioridade', async () => {
        const lista = prods(20)
        const { container } = await montar({ productions: lista, emAlta: lista, currentType: 'drama' })
        const cards = [...container.querySelectorAll('[data-bloco="listagem-producoes"] [data-card]')]
        expect(cards).toHaveLength(20)
        expect(cards.slice(0, 3).map((c) => c.getAttribute('data-prioridade'))).toEqual(['true', 'true', 'false'])
    })
})

describe('ProductionsPage — grade e anúncio', () => {
    it('com anúncio, a grade vira fatias de 12 com o anúncio entre elas', async () => {
        const { container } = await montar({ productions: prods(30) })
        const grades = container.querySelectorAll('[data-bloco="listagem-producoes"]')
        expect(grades).toHaveLength(2)
        expect(grades[0].querySelectorAll('[data-card]')).toHaveLength(12)
        expect(grades[1].querySelectorAll('[data-card]')).toHaveLength(18)
        expect(container.querySelectorAll('[data-anuncio="productions_grid_1"]')).toHaveLength(1)
    })

    it('com menos de 18 itens a grade fica numa fatia só, sem anúncio', async () => {
        const { container } = await montar({ productions: prods(17) })
        expect(container.querySelectorAll('[data-bloco="listagem-producoes"]')).toHaveLength(1)
        expect(container.querySelector('[data-anuncio="productions_grid_1"]')).toBeNull()
    })

    it('exatamente 18 itens já abre a segunda fatia', async () => {
        const { container } = await montar({ productions: prods(18) })
        expect(container.querySelectorAll('[data-bloco="listagem-producoes"]')).toHaveLength(2)
    })

    it('sem slot inline, a grade fica numa fatia só', async () => {
        ads.ADSENSE.slots.inline = undefined
        const { container } = await montar({ productions: prods(30) })
        expect(container.querySelectorAll('[data-bloco="listagem-producoes"]')).toHaveLength(1)
        expect(container.querySelector('[data-anuncio="productions_grid_1"]')).toBeNull()
    })

    it('os cartões da grade usam a variante de catálogo', async () => {
        const { container } = await montar({ productions: prods(3) })
        expect([...container.querySelectorAll('[data-bloco="listagem-producoes"] [data-card]')].every((c) => c.getAttribute('data-variante') === 'catalog')).toBe(true)
    })
})

describe('ProductionsPage — lista vazia', () => {
    it('sem itens e sem busca, usa a mensagem de "nada"', async () => {
        const { container } = await montar({ productions: [], total: 0 })
        expect(container.querySelector('[data-vazio]')?.getAttribute('data-descricao')).toBe('emptyNone')
        expect(container.querySelector('[data-bloco="listagem-producoes"]')).toBeNull()
    })

    it('com busca, a mensagem cita o termo', async () => {
        const { container } = await montar({ productions: [], total: 0, search: 'xyz' })
        expect(container.querySelector('[data-vazio]')?.getAttribute('data-descricao')).toBe('emptySearch~{"query":"xyz"}')
    })

    it('"Em alta" cobrindo tudo deixa a grade vazia no início', async () => {
        const lista = prods(10)
        const { container } = await montar({ productions: lista, emAlta: lista })
        expect(container.querySelector('[data-vazio]')).not.toBeNull()
    })
})

describe('ProductionsPage — links', () => {
    it('o chip "todos" limpa tipo, gênero e plataforma mas mantém a busca e a ordem', async () => {
        const { container } = await montar({ currentType: 'drama', currentGenre: 'romance', currentPlatform: 'netflix', search: 'a', currentOrder: 'recent' })
        const grupo = container.querySelector('[role="group"]')!
        expect(hrefs(grupo)[0]).toBe('/productions?order=recent&search=a')
    })

    it('os chips de tipo trocam o tipo e preservam os demais filtros', async () => {
        const { container } = await montar({ currentGenre: 'romance', currentPlatform: 'netflix' })
        const links = hrefs(container.querySelector('[role="group"]'))
        expect(links).toEqual([
            '/productions',
            '/productions?type=drama&genre=romance&platform=netflix',
            '/productions?type=movie&genre=romance&platform=netflix',
            '/productions?type=special&genre=romance&platform=netflix',
            '/productions?type=variety&genre=romance&platform=netflix',
        ])
    })

    it('as abas de ordem omitem "order" em em alta e trocam nas demais', async () => {
        const { container } = await montar({ currentType: 'drama' })
        const abas = hrefs(container.querySelectorAll('[role="group"]')[1])
        expect(abas).toEqual(['/productions?type=drama', '/productions?type=drama&order=recent', '/productions?type=drama&order=az'])
    })

    it('"ver mais" aparece fora da última página com o que falta, e aponta para a seguinte', async () => {
        const { container } = await montar({ productions: prods(24), total: 60, totalPages: 3, currentPage: 1 })
        const mais = [...container.querySelectorAll('a')].find((a) => a.textContent?.startsWith('seeMore'))!
        expect(mais.getAttribute('href')).toBe('/productions?page=2')
        expect(mais.textContent).toBe('seeMore~{"count":36}')
    })

    it('na última página não há "ver mais"', async () => {
        const { container } = await montar({ productions: prods(12), total: 60, totalPages: 3, currentPage: 3 })
        expect([...container.querySelectorAll('a')].some((a) => a.textContent?.startsWith('seeMore'))).toBe(false)
    })

    it('a paginação monta links que preservam filtros e omitem page=1', async () => {
        const { container } = await montar({ productions: prods(5), total: 100, totalPages: 5, currentPage: 2, currentGenre: 'romance' })
        const pag = container.querySelector('[data-paginacao]')!
        expect(pag.getAttribute('data-atual')).toBe('2')
        expect(pag.getAttribute('data-href3')).toBe('/productions?genre=romance&page=3')
    })

    it('o campo de busca recebe o termo atual', async () => {
        const { container } = await montar({ search: 'crash' })
        expect((container.querySelector('[data-busca]') as HTMLInputElement).value).toBe('crash')
    })
})

describe.skipIf(!OUTRO)('ProductionsPage — outro idioma', () => {
    it('sem quiz nem vitrine da loja (só em português), mas com as faixas', async () => {
        const { container } = await montar({ locale: OUTRO!, emAlta: prods(3), shopProducts: [{ id: 1 } as never] })
        expect(container.querySelector('[data-quiz]')).toBeNull()
        expect(container.querySelector('[data-loja]')).toBeNull()
        expect(bloco(container, 'lista-em-alta')).not.toBeNull()
    })
})

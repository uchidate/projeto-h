// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'
import type { ComponentProps } from 'react'

// Cobre o que a lista do blog decide: destaque e "Últimas", grade em múltiplos de 6 com o resto em lista
// compacta, vitrine da categoria, faixa de descoberta, chips de categoria, paginação com janela, anúncios,
// lista vazia e o que muda em outro idioma.
const ads = vi.hoisted(() => ({
    ADSENSE: { slots: { leaderboard: 'lb' as string | undefined, inline: 'in' as string | undefined, article_sidebar: 'side' as string | undefined } },
}))

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/config/ads', () => ads)
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, scroll: _scroll, ...rest }: { href: string; children: React.ReactNode; scroll?: boolean }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('@/components/ui/SearchInput', () => ({ SearchInput: (p: { current?: string }) => <input data-busca defaultValue={p.current ?? ''} /> }))
vi.mock('@/components/blog/BlogPostCard', () => ({
    BlogPostCard: (p: { post: { id: number }; compactoNoCelular?: boolean }) => <article data-card data-id={p.post.id} data-compacto={String(!!p.compactoNoCelular)} />,
}))
vi.mock('@/components/blog/BlogCompactCard', () => ({
    BlogCompactCard: (p: { post: { id: number }; rank: number }) => <div data-compacto-card data-id={p.post.id} data-rank={p.rank} />,
}))
vi.mock('@/components/blog/BlogSidebar', () => ({
    BlogSidebar: (p: { recentPosts: { id: number }[]; categories: { slug: string }[] }) => (
        <div data-sidebar data-recentes={p.recentPosts.map(x => x.id).join(',')} data-cats={p.categories.map(c => c.slug).join(',')} />
    ),
}))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: (p: { analyticsPlacement: string }) => <div data-anuncio={p.analyticsPlacement} /> }))
vi.mock('@/components/ui/EmptyState', () => ({ EmptyState: () => <div data-vazio /> }))
vi.mock('@/components/blog/BlogDestaque', () => ({ BlogDestaque: (p: { candidatos: unknown[] }) => <div data-destaque={p.candidatos.length} /> }))
vi.mock('@/components/blog/BlogHeroCompacto', () => ({ BlogHeroCompacto: (p: { post: { id: number } }) => <div data-hero data-id={p.post.id} /> }))
vi.mock('@/components/blog/BlogEmAlta', () => ({
    BlogEmAlta: (p: { posts: { id: number }[]; ultimas: { id: number }[] }) => (
        <div data-em-alta data-ultimas={p.ultimas.map(x => x.id).join(',')} data-alta={p.posts.map(x => x.id).join(',')} />
    ),
}))
vi.mock('@/components/blog/BlogGuiaCard', () => ({ BlogGuiaCard: (p: { post: { id: number } }) => <div data-guia-card data-id={p.post.id} /> }))
vi.mock('@/components/blog/BlogListaSidebarAd', () => ({ BlogListaSidebarAd: () => <div data-sidebar-ad /> }))
vi.mock('@/components/analytics/RastreioDeFiltros', () => ({ RastreioDeFiltros: () => null }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({
    ShopRelatedSection: (p: { title: string; bloco?: string }) => <div data-loja={p.bloco ?? 'geral'} data-titulo={p.title} />,
}))
vi.mock('@/components/blog/BlogMarcasFaixa', () => ({ BlogMarcasFaixa: () => <div data-marcas /> }))

import { BlogPage } from './BlogPage'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Props = ComponentProps<typeof BlogPage>
let seq = 0
const post = (): Props['posts'][number] => ({ id: ++seq, slug: `post-${seq}`, categories: [1] }) as unknown as Props['posts'][number]
const posts = (n: number) => Array.from({ length: n }, post)
const cat = (id: number, slug: string, count: number) => ({ id, slug, name: slug.toUpperCase(), count }) as unknown as Props['categories'][number]

const CATEGORIAS = [cat(1, 'kpop', 50), cat(2, 'kdrama', 40), cat(3, 'cinema', 30), cat(4, 'musica', 20), cat(5, 'moda', 10), cat(6, 'comida', 5), cat(7, 'uncategorized', 99)]

async function montar(extra: Partial<Props> = {}) {
    const lista = extra.posts ?? posts(13)
    return render(await BlogPage({
        posts: lista, total: lista.length, totalPages: 1, categories: CATEGORIAS, currentPage: 1, ...extra,
    }))
}

const ids = (el: Element, seletor: string, attr = 'data-id') => [...el.querySelectorAll(seletor)].map((n) => Number(n.getAttribute(attr)))
const hrefs = (el: Element | null) => [...(el?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'))

beforeEach(() => {
    seq = 0
    ads.ADSENSE.slots.leaderboard = 'lb'
    ads.ADSENSE.slots.inline = 'in'
    ads.ADSENSE.slots.article_sidebar = 'side'
})
afterEach(cleanup)

describe('BlogPage — primeira página sem filtro', () => {
    it('o destaque é o primeiro candidato; "Últimas" são os 4 seguintes e não repetem na grade', async () => {
        const lista = posts(18)
        const destaque = lista[5]
        const { container } = await montar({ posts: lista, destaques: [destaque] })
        expect(ids(container, '[data-hero]')).toEqual([destaque.id])
        expect(container.querySelector('[data-em-alta]')?.getAttribute('data-ultimas')).toBe('1,2,3,4')
        const naGrade = ids(container, '[data-card]')
        expect(naGrade).not.toContain(destaque.id)
        for (const id of [1, 2, 3, 4]) expect(naGrade).not.toContain(id)
    })

    it('sem candidatos, o destaque é o primeiro post da lista', async () => {
        const lista = posts(13)
        const { container } = await montar({ posts: lista })
        expect(ids(container, '[data-hero]')).toEqual([lista[0].id])
    })

    it('vários candidatos viram o rodízio de destaque', async () => {
        const lista = posts(13)
        const { container } = await montar({ posts: lista, destaques: [lista[0], lista[1], lista[2]] })
        expect(container.querySelector('[data-destaque]')?.getAttribute('data-destaque')).toBe('3')
        expect(container.querySelector('[data-hero]')).toBeNull()
    })

    it('a grade fecha em múltiplos de 6 e o resto vai para a lista compacta com a posição certa', async () => {
        // 18 posts: hero + 4 "Últimas" = 5; sobram 13 → 12 na grade e 1 compacto (posição 13)
        const { container } = await montar({ posts: posts(18) })
        expect(container.querySelectorAll('[data-card]')).toHaveLength(12)
        const compactos = container.querySelectorAll('[data-compacto-card]')
        expect(compactos).toHaveLength(1)
        expect(compactos[0].getAttribute('data-rank')).toBe('13')
    })

    it('com menos de 6 posts na grade, todos ficam nela e não há lista compacta', async () => {
        const { container } = await montar({ posts: posts(8) }) // hero + 4 últimas → 3 na grade
        expect(container.querySelectorAll('[data-card]')).toHaveLength(3)
        expect(container.querySelector('[data-compacto-card]')).toBeNull()
    })

    it('só o primeiro cartão da grade aparece inteiro no celular', async () => {
        const { container } = await montar({ posts: posts(18) })
        const cartoes = [...container.querySelectorAll('[data-card]')]
        expect(cartoes[0].getAttribute('data-compacto')).toBe('false')
        expect(cartoes.slice(1).every((c) => c.getAttribute('data-compacto') === 'true')).toBe(true)
    })

    it('abas de tipo: notícias ativa, guias de compra e mais lidos', async () => {
        const { container } = await montar()
        const abas = container.querySelector('[role="group"][aria-label="listTypeAria"]')
        expect(hrefs(abas)).toEqual(['/blog', '/blog?tipo=guias', '/blog?order=lidos'])
        expect(abas?.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe('/blog')
        expect(container.querySelector('p.font-mono')?.textContent).toBe('latestNews')
    })
})

describe('BlogPage — onde o destaque não aparece', () => {
    it.each([
        ['filtro de categoria', { currentCategory: 'kpop' }],
        ['filtro de tag', { currentTag: 'bts' }],
        ['busca', { currentSearch: 'iu' }],
        ['página 2', { currentPage: 2 }],
        ['ordem por leitura', { order: 'lidos' }],
        ['guias de compra', { tipo: 'guias' as const }],
    ])('%s: sem destaque nem "Últimas"; a lista inteira vai para a grade', async (_nome, extra) => {
        const { container } = await montar({ posts: posts(12), ...extra })
        expect(container.querySelector('[data-hero]')).toBeNull()
        expect(container.querySelector('[data-em-alta]')).toBeNull()
        expect(container.querySelectorAll('[data-card]')).toHaveLength(12)
    })

    it('filtrado: título da lista vira "found", aparece "limpar" e somem as abas', async () => {
        const { container } = await montar({ currentCategory: 'kpop' })
        expect(container.querySelector('p.font-mono')?.textContent).toBe('found')
        expect(hrefs(container)).toContain('/blog')
        expect(container.textContent).toContain('clearFilter')
        expect(container.querySelector('[aria-label="listTypeAria"]')).toBeNull()
        expect(container.querySelector('h1')?.textContent).toContain('KPOP')
    })

    it('rótulo da lista muda com order=lidos e tipo=guias', async () => {
        expect((await montar({ order: 'lidos' })).container.querySelector('p.font-mono')?.textContent).toBe('tabMostRead')
        cleanup()
        expect((await montar({ tipo: 'guias' })).container.querySelector('p.font-mono')?.textContent).toBe('tabBuyingGuides')
    })
})

describe('BlogPage — chips e lateral', () => {
    it('chips: "Todas" e as 5 maiores, sem "uncategorized"', async () => {
        const { container } = await montar()
        const chips = container.querySelector('[role="group"][aria-label="categoriesAria"]')
        expect(hrefs(chips)).toEqual(['/blog', '/blog?category=kpop', '/blog?category=kdrama', '/blog?category=cinema', '/blog?category=musica', '/blog?category=moda'])
    })

    it('categoria atual fora das 5 maiores entra no lugar da quinta', async () => {
        const { container } = await montar({ currentCategory: 'comida' })
        const chips = container.querySelector('[role="group"][aria-label="categoriesAria"]')
        expect(hrefs(chips)).toEqual(['/blog', '/blog?category=kpop', '/blog?category=kdrama', '/blog?category=cinema', '/blog?category=musica', '/blog?category=comida'])
    })

    it('"Todas" mantém o tipo guias', async () => {
        const { container } = await montar({ tipo: 'guias' })
        expect(hrefs(container.querySelector('[aria-label="categoriesAria"]'))[0]).toBe('/blog?tipo=guias')
    })

    it('a lateral lista só as categorias que não estão nos chips', async () => {
        const { container } = await montar()
        expect(container.querySelector('[data-sidebar]')?.getAttribute('data-cats')).toBe('comida')
    })

    it('a lateral nunca repete post da tela e mostra no máximo 5', async () => {
        const lista = posts(13)
        const fora = posts(8)
        const { container } = await montar({ posts: lista, sidebarPosts: [lista[0], ...fora] })
        const recentes = container.querySelector('[data-sidebar]')!.getAttribute('data-recentes')!.split(',').map(Number)
        expect(recentes).toHaveLength(5)
        expect(recentes).not.toContain(lista[0].id)
        expect(recentes).toEqual(fora.slice(0, 5).map((p) => p.id))
    })
})

describe('BlogPage — paginação', () => {
    it('sem mais de uma página não há navegação', async () => {
        expect((await montar({ totalPages: 1 })).container.querySelector('nav')).toBeNull()
    })

    it('até 7 páginas mostra todos os números; a atual ganha aria-current e não há seta para trás na 1ª', async () => {
        const { container } = await montar({ totalPages: 5, currentPage: 1 })
        const nav = container.querySelector('nav[aria-label="paginationAria"]')!
        expect(hrefs(nav)).toEqual(['/blog', '/blog?page=2', '/blog?page=3', '/blog?page=4', '/blog?page=5', '/blog?page=2'])
        expect(nav.querySelector('a[aria-current="page"]')?.textContent).toBe('1')
    })

    it('com muitas páginas usa janela de 5 com reticências dos dois lados', async () => {
        const { container } = await montar({ totalPages: 20, currentPage: 10 })
        const nav = container.querySelector('nav')!
        const texto = [...nav.querySelectorAll('a, span')].map((n) => n.textContent).filter((t) => t && !t.startsWith('summary'))
        expect(texto).toEqual(['←', '1', '…', '8', '9', '10', '11', '12', '…', '20', '→'])
    })

    it('perto do começo e do fim só há reticências do lado que falta', async () => {
        const inicio = await montar({ totalPages: 20, currentPage: 2 })
        expect([...inicio.container.querySelectorAll('nav span')].filter((s) => s.textContent === '…')).toHaveLength(1)
        cleanup()
        const fim = await montar({ totalPages: 20, currentPage: 19 })
        expect([...fim.container.querySelectorAll('nav span')].filter((s) => s.textContent === '…')).toHaveLength(1)
    })

    it('os links preservam categoria, tag, busca, ordem e tipo, e a página 1 não leva page', async () => {
        const { container } = await montar({ totalPages: 3, currentPage: 2, currentCategory: 'kpop', currentTag: 'bts', currentSearch: 'iu', order: 'lidos', tipo: 'guias' })
        const links = hrefs(container.querySelector('nav'))
        expect(links[0]).toBe('/blog?order=lidos&tipo=guias&category=kpop&tag=bts&search=iu')
        expect(links).toContain('/blog?order=lidos&tipo=guias&category=kpop&tag=bts&search=iu&page=3')
    })

    it('o resumo leva total, página e total de páginas', async () => {
        const { container } = await montar({ totalPages: 3, currentPage: 2, total: 1234 })
        expect(container.querySelector('nav span.w-full')?.textContent).toMatch(/^summary~\{"total":".+","page":2,"pages":3\}$/)
    })
})

describe('BlogPage — faixa de descoberta e loja', () => {
    const produtos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1 })) as unknown as Props['shopProducts']
    const hub = (slug: string) => ({ slug, shortTitle: slug }) as unknown as NonNullable<Props['guias']>[number]
    const categoriaLoja = (n: number, marcas = 0) => ({ rotulo: 'K-beauty', categoriaLoja: 'kbeauty', industria: 'beauty', marcas: Array.from({ length: marcas }, () => ({})), produtos: produtos(n) }) as unknown as Props['categoriaLoja']

    it('"comece por aqui" exige 3 perenes e mostra no máximo 4', async () => {
        const { container } = await montar({ perenes: posts(2) })
        expect(container.querySelector('[data-bloco="blog-comece-por-aqui"]')).toBeNull()
        cleanup()
        const com = await montar({ perenes: posts(6) })
        expect(com.container.querySelectorAll('[data-guia-card]')).toHaveLength(4)
    })

    it('guias aparecem só na primeira página sem filtro e linkam para /guias/{slug}', async () => {
        const { container } = await montar({ guias: [hub('a'), hub('b')] })
        expect(hrefs(container.querySelector('[data-bloco="blog-guias"]'))).toEqual(['/guias/a', '/guias/b'])
        cleanup()
        expect((await montar({ guias: [hub('a')], currentPage: 2 })).container.querySelector('[data-bloco="blog-guias"]')).toBeNull()
    })

    it('sem destaque (filtro) a faixa inteira some, mesmo com dados', async () => {
        const { container } = await montar({ currentCategory: 'kpop', perenes: posts(4), guias: [hub('a')], shopProducts: produtos(3) })
        expect(container.querySelector('[data-bloco="blog-comece-por-aqui"]')).toBeNull()
        expect(container.querySelector('[data-bloco="blog-guias"]')).toBeNull()
        expect(container.querySelector('[data-loja]')).toBeNull()
    })

    it('"Achados da curadoria" só em português', async () => {
        const { container } = await montar({ shopProducts: produtos(3) })
        expect(container.querySelector('[data-loja="geral"]')?.getAttribute('data-titulo')).toBe('Achados da curadoria')
        if (!OUTRO) return
        cleanup()
        expect((await montar({ shopProducts: produtos(3), locale: OUTRO })).container.querySelector('[data-loja]')).toBeNull()
    })

    it('vitrine da categoria exige 4 produtos, entra depois das 6 primeiras notícias e só em português', async () => {
        const { container } = await montar({ posts: posts(12), currentCategory: 'kpop', categoriaLoja: categoriaLoja(4) })
        const vitrine = container.querySelector('[data-loja="blog-vitrine-categoria"]')
        expect(vitrine).not.toBeNull()
        const antes = [...container.querySelectorAll('[data-card], [data-loja]')]
        expect(antes.findIndex((n) => n === vitrine)).toBe(6)
        cleanup()
        expect((await montar({ posts: posts(12), currentCategory: 'kpop', categoriaLoja: categoriaLoja(3) })).container.querySelector('[data-loja]')).toBeNull()
    })

    it('faixa de marcas exige 4 marcas', async () => {
        expect((await montar({ categoriaLoja: categoriaLoja(0, 4) })).container.querySelector('[data-marcas]')).not.toBeNull()
        cleanup()
        expect((await montar({ categoriaLoja: categoriaLoja(0, 3) })).container.querySelector('[data-marcas]')).toBeNull()
    })
})

describe('BlogPage — anúncios', () => {
    it('leaderboard só com destaque; feed sempre que há posts; anúncio lateral com slot', async () => {
        const { container } = await montar()
        expect([...container.querySelectorAll('[data-anuncio]')].map((a) => a.getAttribute('data-anuncio')).sort()).toEqual(['blog_feed', 'blog_leaderboard'])
        expect(container.querySelector('[data-sidebar-ad]')).not.toBeNull()
        cleanup()
        const filtrado = await montar({ currentCategory: 'kpop' })
        expect([...filtrado.container.querySelectorAll('[data-anuncio]')].map((a) => a.getAttribute('data-anuncio'))).toEqual(['blog_feed'])
    })

    it('sem slots configurados, nenhum anúncio', async () => {
        ads.ADSENSE.slots.leaderboard = undefined
        ads.ADSENSE.slots.inline = undefined
        ads.ADSENSE.slots.article_sidebar = undefined
        const { container } = await montar()
        expect(container.querySelector('[data-anuncio]')).toBeNull()
        expect(container.querySelector('[data-sidebar-ad]')).toBeNull()
    })
})

describe('BlogPage — vazio e idioma', () => {
    it('sem posts mostra o estado vazio, sem paginação nem anúncio de feed', async () => {
        const { container } = await montar({ posts: [], total: 0, totalPages: 3, currentPage: 1 })
        expect(container.querySelector('[data-vazio]')).not.toBeNull()
        expect(container.querySelector('nav')).toBeNull()
        expect(container.querySelector('[data-anuncio="blog_feed"]')).toBeNull()
    })

    it.skipIf(!OUTRO)('em outro idioma não existe a aba "mais lidos"', async () => {
        const { container } = await montar({ locale: OUTRO! })
        expect(hrefs(container.querySelector('[aria-label="listTypeAria"]'))).toEqual(['/blog', '/blog?tipo=guias'])
    })
})

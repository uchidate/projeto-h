// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { getFoods } from '@/lib/wordpress/foods'
import { buildVitrineMatcher } from '@/lib/wordpress/vitrine'
import { getCategories, getPosts } from '@/lib/wordpress/posts'
import { carregarLojaDoTema } from '@/lib/blog/lojaDoTema'
import { receitasEmDestaque } from '@/lib/comidas/receitasEmDestaque'
import { todasReceitas } from '@/lib/receitas'
import { produtosIcones } from '@/lib/comidas/iconesDaLoja'
import { metadataDeListagem } from '@/lib/listagem'
import { temRecurso } from '@/lib/i18n/recursos'
import { hasLocale } from '@/lib/i18n/entity-translation'
import { ADSENSE } from '@/lib/config/ads'
import { ComidasListagem, metadataComidas } from './ComidasListagem'

vi.mock('next-intl/server', () => ({
    getTranslations: async () => {
        const t = (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key)
        return Object.assign(t, { has: (k: string) => k === 'comida' })
    },
}))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
        // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
        <img src={src} alt={alt} />
    ),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) => (
        <a href={href} className={className}>{children}</a>
    ),
}))
vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: vi.fn(() => ({ en: '/en/foods' })) }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    hasLocale: vi.fn(() => true),
    localizeEntity: (e: object) => ({ ...e, localizado: true }),
}))
vi.mock('@/lib/i18n/localizar-caminho', () => ({
    localizarCaminho: (p: string, locale: string) => (locale === 'pt' ? p : `/${locale}${p}`),
}))
vi.mock('@/lib/i18n/routes', () => ({ href: (_: string, __: unknown, locale: string) => `/${locale}/comidas` }))
vi.mock('@/lib/i18n/recursos', () => ({ temRecurso: vi.fn(() => true) }))
vi.mock('@/lib/listagem', () => ({ metadataDeListagem: vi.fn((a: unknown) => ({ args: a })) }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: 'slot-inline' } } }))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: (p: { analyticsPlacement: string }) => <div data-ad={p.analyticsPlacement} />,
}))
vi.mock('@/lib/wordpress/foods', () => ({
    getFoods: vi.fn(),
    FOOD_CATEGORY_LABELS: { rice: 'Arroz', soup: 'Sopa' },
    FOOD_CATEGORY_EMOJI: { rice: '🍚', soup: '🍲' },
    KOREA_REGIONS: ['seoul', 'busan'],
}))
vi.mock('@/lib/constants/site', () => ({ SITE_URL: 'https://site.test' }))
vi.mock('@/components/food/KoreaRegionMap', () => ({
    KoreaRegionMap: (p: { activeRegion?: string }) => <div data-mapa={p.activeRegion ?? ''} />,
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => <nav data-breadcrumb /> }))
vi.mock('@/lib/wordpress/vitrine', () => ({ buildVitrineMatcher: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn(), getCategories: vi.fn() }))
vi.mock('@/components/blog/BlogGuiaCard', () => ({
    BlogGuiaCard: (p: { post: { id: number }; categoryMap: Record<number, { name: string }> }) => (
        <div data-guia={p.post.id} data-categorias={Object.values(p.categoryMap).map(c => c.name).join(',')} />
    ),
}))
vi.mock('@/components/ui/ShopRelatedSection', () => ({
    ShopRelatedSection: (p: { bloco: string; products: unknown[]; href: string }) => (
        <div data-loja={p.bloco} data-n={p.products.length} data-href={p.href} />
    ),
}))
vi.mock('@/lib/blog/categoriaLoja', () => ({ CATEGORIAS_COM_LOJA: { comida: { chave: 'comida' } } }))
vi.mock('@/lib/blog/lojaDoTema', () => ({ carregarLojaDoTema: vi.fn() }))
vi.mock('@/components/blog/BlogMarcasFaixa', () => ({
    BlogMarcasFaixa: (p: { todasHref: string }) => <div data-marcas data-href={p.todasHref} />,
}))
vi.mock('@/lib/comidas/receitasEmDestaque', () => ({ receitasEmDestaque: vi.fn() }))
vi.mock('@/lib/receitas', () => ({ todasReceitas: vi.fn() }))
vi.mock('@/lib/comidas/iconesDaLoja', () => ({ produtosIcones: vi.fn() }))
vi.mock('@/components/comidas/ComidasDestaques', () => ({
    ComidasDestaques: (p: { pratos: unknown[] }) => <div data-destaques data-n={p.pratos.length} />,
}))

type Obj = Record<string, unknown>
type Sp = Parameters<typeof ComidasListagem>[0]['searchParams']

const prato = (id: number, acf: Obj = {}, over: Obj = {}) => ({
    id, slug: `prato-${id}`, title: { rendered: `Prato ${id}` }, featured_image_url: `https://img.test/${id}.jpg`, acf, ...over,
})
const sp = (o: Obj = {}) => Promise.resolve(o) as Sp
const loja = (over: Obj = {}) => ({
    produtos: [1, 2, 3, 4].map(id => ({ id })), marcas: [1, 2, 3, 4].map(id => ({ id })), todos: [1], categoriaLoja: 'comida',
    rotulo: 'Comida', industria: 'food', ...over,
})

function configurar(foods: unknown[] = [], extra: { total?: number; totalPages?: number } = {}) {
    vi.mocked(getFoods).mockImplementation((async (p: { perPage?: number }) =>
        p.perPage === 100 ? { items: [prato(100), prato(101)] } : { items: foods, total: extra.total ?? foods.length, totalPages: extra.totalPages ?? 1 }) as never)
}
async function montar(o: Obj = {}, locale?: 'en') {
    return render(await ComidasListagem({ searchParams: sp(o), locale }))
}
const links = (c: HTMLElement) => Array.from(c.querySelectorAll('a')).map(a => a.getAttribute('href'))
const bloco = (c: HTMLElement, b: string) => c.querySelector(`[data-loja="${b}"]`)
const ativos = (c: HTMLElement) => Array.from(c.querySelectorAll('a.bg-accent-a11y')).map(a => a.getAttribute('href'))

beforeEach(() => {
    configurar([prato(1)])
    vi.mocked(buildVitrineMatcher).mockResolvedValue((() => false) as never)
    vi.mocked(getPosts).mockResolvedValue({ items: [] } as never)
    vi.mocked(getCategories).mockResolvedValue([] as never)
    vi.mocked(carregarLojaDoTema).mockResolvedValue(undefined as never)
    vi.mocked(receitasEmDestaque).mockReturnValue([])
    vi.mocked(todasReceitas).mockResolvedValue({} as never)
    vi.mocked(produtosIcones).mockReturnValue([])
    vi.mocked(temRecurso).mockReturnValue(true)
    vi.mocked(hasLocale).mockReturnValue(true)
    ;(ADSENSE.slots as Record<string, string | undefined>).inline = 'slot-inline'
})
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('metadataComidas', () => {
    const meta = async (o: Obj = {}, locale?: 'en') => {
        configurar([], { totalPages: 5 })
        const m = await metadataComidas({ searchParams: sp(o), locale })
        return (m as unknown as { args: Parameters<typeof metadataDeListagem>[0] }).args
    }

    it('lista sem filtro: página 1, sem facetas, textos do idioma', async () => {
        const a = await meta()
        expect(a).toMatchObject({ titulo: 'metaTitle', descricao: 'metaDescription', url: 'https://site.test/comidas', page: 1, totalPages: 5, temFiltro: false })
    })

    it('filtros viram parâmetros da busca e marcam facetas', async () => {
        const a = await meta({ category: 'rice', vegetarian: 'true', maxSpicy: '2', region: 'seoul', page: '3' })
        expect(a.temFiltro).toBe(true)
        expect(a.page).toBe(3)
        expect(vi.mocked(getFoods)).toHaveBeenCalledWith(expect.objectContaining({ category: 'rice', vegetarian: true, maxSpicy: 2, region: 'seoul', page: 3 }))
    })

    it('categoria e região inválidas são descartadas', async () => {
        await meta({ category: 'pizza', region: 'marte' })
        expect(vi.mocked(getFoods)).toHaveBeenCalledWith(expect.objectContaining({ category: undefined, region: undefined }))
    })

    it('em outro idioma pede o locale e a URL leva o prefixo; o link da página mantém os filtros', async () => {
        const a = await meta({ category: 'rice' }, 'en')
        expect(vi.mocked(getFoods).mock.calls[0][0]).toMatchObject({ locale: 'en' })
        expect(a.url).toBe('https://site.test/en/comidas?category=rice')
        expect(a.urlDaPagina(2)).toBe('https://site.test/en/comidas?category=rice&page=2')
        expect(a.urlDaPagina(1)).toBe('https://site.test/en/comidas?category=rice')
        expect(a.idiomas?.()).toEqual({ en: '/en/foods' })
    })
})

describe('ComidasListagem: filtros e paginação', () => {
    it('página acima do total cai em notFound; lista vazia na página 1 não', async () => {
        configurar([prato(1)], { totalPages: 2 })
        await expect(ComidasListagem({ searchParams: sp({ page: '3' }) })).rejects.toThrow('NEXT_NOT_FOUND')
        configurar([], { totalPages: 0 })
        await expect(montar()).resolves.toBeTruthy()
    })

    it('chip da categoria ativa, "todas" sai do filtro e página some ao trocar categoria', async () => {
        configurar([prato(1)], { totalPages: 2 })
        const { container } = await montar({ category: 'rice', page: '2', vegetarian: 'true' })
        const hrefs = links(container)
        expect(hrefs).toContain('/comidas?vegetarian=true')
        expect(hrefs).toContain('/comidas?category=soup&vegetarian=true')
        expect(ativos(container)).toContain('/comidas?category=rice&vegetarian=true')
    })

    it('"todas" fica ativo sem categoria', async () => {
        const { container } = await montar()
        expect(ativos(container)).toEqual(['/comidas'])
    })

    it('coleção curada ativa quando a query bate exatamente', async () => {
        const { container } = await montar({ season: 'winter' })
        expect(ativos(container)).toContain('/comidas?season=winter')
        expect(ativos(container)).not.toContain('/comidas?vegetarian=true')
        const outra = await montar({ maxSpicy: '0' })
        expect(ativos(outra.container)).toContain('/comidas?maxSpicy=0')
    })

    it('paginação com anterior, próxima e "página x de y", mantendo filtros', async () => {
        configurar([prato(1)], { totalPages: 3 })
        const { container } = await montar({ page: '2', category: 'rice' })
        expect(links(container)).toContain('/comidas?category=rice')
        expect(links(container)).toContain('/comidas?category=rice&page=3')
        expect(container.textContent).toContain('pageOf~{"page":2,"total":3}')
    })

    it('primeira página só tem "próxima"; última só tem "anterior"; uma página não pagina', async () => {
        configurar([prato(1)], { totalPages: 3 })
        const primeira = await montar()
        expect(primeira.container.textContent).toContain('next')
        expect(primeira.container.textContent).not.toContain('prev')
        cleanup()
        const ultima = await montar({ page: '3' })
        expect(ultima.container.textContent).toContain('prev')
        expect(ultima.container.textContent).not.toContain('next')
        cleanup()
        configurar([prato(1)], { totalPages: 1 })
        expect((await montar()).container.textContent).not.toContain('pageOf')
    })

    it('busca na API com 48 por página e filtros convertidos', async () => {
        await montar({ category: 'soup', vegetarian: 'true', maxSpicy: '1', region: 'busan', occasion: 'comfort', season: 'winter', search: 'kimchi' })
        expect(vi.mocked(getFoods)).toHaveBeenCalledWith({
            page: 1, perPage: 48, search: 'kimchi', category: 'soup', vegetarian: true, occasion: 'comfort', season: 'winter',
            maxSpicy: 1, region: 'busan', orderby: 'date', order: 'desc', locale: undefined,
        })
    })
})

describe('ComidasListagem: cartões e estados', () => {
    it('cartão com foto, nome coreano, categoria, pimenta limitada a 3 e selo vegano', async () => {
        configurar([prato(1, { name_korean: '김치', category: 'rice', spicy_level: 5, is_vegan: true, is_vegetarian: true })])
        const { container } = await montar()
        const card = container.querySelector('a[href="/comidas/prato-1"]')!
        expect(card.querySelector('img')!.getAttribute('src')).toBe('https://img.test/1.jpg')
        expect(card.textContent).toContain('김치')
        expect(card.textContent).toContain('rice') // rótulo traduzido (o mock devolve a chave)
        expect(card.textContent).toContain('VEGAN')
        expect(card.textContent!.match(/🌶️/g)).toHaveLength(3)
    })

    it('vegetariano mostra VEG; sem pimenta, sem selo de pimenta; sem foto mostra o emoji da categoria', async () => {
        configurar([prato(1, { is_vegetarian: true, category: 'soup' }, { featured_image_url: undefined }), prato(2, {}, { featured_image_url: undefined })])
        const { container } = await montar()
        const um = container.querySelector('a[href="/comidas/prato-1"]')!
        expect(um.textContent).toContain('VEG')
        expect(um.textContent).not.toContain('VEGAN')
        expect(um.textContent).not.toContain('🌶️')
        expect(um.querySelector('img')).toBeNull()
        expect(um.textContent).toContain('🍲')
        expect(container.querySelector('a[href="/comidas/prato-2"]')!.textContent).toContain('🍽️')
    })

    it('"na loja" só com recurso de loja e prato casado na vitrine', async () => {
        vi.mocked(buildVitrineMatcher).mockResolvedValue(((nomes: string[]) => nomes.includes('Arroz de alho')) as never)
        configurar([prato(1, { main_ingredients: ['Arroz de alho'] }), prato(2)])
        const { container } = await montar()
        expect(container.querySelector('a[href="/comidas/prato-1"]')!.textContent).toContain('inStore')
        expect(container.querySelector('a[href="/comidas/prato-2"]')!.textContent).not.toContain('inStore')
        cleanup()
        vi.mocked(temRecurso).mockReturnValue(false)
        expect((await montar()).container.textContent).not.toContain('inStore')
    })

    it('contagem com e sem categoria', async () => {
        configurar([prato(1)], { total: 77 })
        expect((await montar()).container.textContent).toContain('count~{"count":77}')
        cleanup()
        expect((await montar({ category: 'rice' })).container.textContent).toContain('countIn~{"category":"rice"}')
    })

    it('sem resultados mostra o estado vazio com volta ao catálogo', async () => {
        configurar([])
        const { container } = await montar({ search: 'xyz' })
        expect(container.textContent).toContain('emptyTitle')
        expect(links(container)).toContain('/comidas')
        expect(container.querySelector('[data-ad]')).toBeNull()
    })

    it('anúncio só com resultados e slot configurado', async () => {
        expect((await montar()).container.querySelector('[data-ad="comidas_lista"]')).not.toBeNull()
        cleanup()
        ;(ADSENSE.slots as Record<string, string | undefined>).inline = undefined
        expect((await montar()).container.querySelector('[data-ad]')).toBeNull()
    })

    it('outro idioma: só pratos com ficha traduzida, já localizados', async () => {
        vi.mocked(hasLocale).mockImplementation(((f: { id: number }) => f.id !== 2) as never)
        configurar([prato(1), prato(2)])
        const { container } = await montar({}, 'en')
        expect(container.querySelector('a[href="/comidas/prato-1"]')).not.toBeNull()
        expect(container.querySelector('a[href="/comidas/prato-2"]')).toBeNull()
        expect(vi.mocked(getFoods).mock.calls[0][0]).toMatchObject({ locale: 'en' })
    })
})

describe('ComidasListagem: blocos da primeira página sem filtro', () => {
    const artigos = [1, 2, 3, 4].map(id => ({ id }))

    it('destaques, mapa e o resto da vitrine aparecem', async () => {
        vi.mocked(getPosts).mockResolvedValue({ items: artigos } as never)
        vi.mocked(getCategories).mockResolvedValue([{ id: 9, name: 'Comida', slug: 'comida' }] as never)
        vi.mocked(carregarLojaDoTema).mockResolvedValue(loja() as never)
        vi.mocked(produtosIcones).mockReturnValue([1, 2, 3].map(id => ({ id })) as never)
        vi.mocked(receitasEmDestaque).mockReturnValue([{ slug: 'bibimbap', nome: 'Bibimbap', imagem: 'https://img.test/r.jpg', tempo: '30 min' }] as never)
        const { container } = await montar()
        expect(container.querySelector('[data-destaques]')!.getAttribute('data-n')).toBe('2')
        expect(container.querySelectorAll('[data-guia]')).toHaveLength(4)
        expect(container.querySelector('[data-guia]')!.getAttribute('data-categorias')).toBe('Comida')
        expect(bloco(container, 'comidas-destaques-produtos')!.getAttribute('data-href')).toBe('/loja?categoria=comida')
        expect(bloco(container, 'comidas-vitrine')!.getAttribute('data-n')).toBe('4')
        expect(container.querySelector('[data-marcas]')!.getAttribute('data-href')).toBe('/empresas?industry=food')
        expect(container.querySelector('[data-mapa]')).not.toBeNull()
        const receitas = container.querySelector('[data-bloco="comidas-receitas"]')!
        expect(receitas.textContent).toContain('Bibimbap')
        expect(receitas.textContent).toContain('30 min')
        expect(receitas.querySelector('a')!.getAttribute('href')).toBe('/comidas/bibimbap')
    })

    it('limiares: menos de 3 artigos, 3 ícones, 4 marcas e 4 produtos escondem o bloco', async () => {
        vi.mocked(getPosts).mockResolvedValue({ items: artigos.slice(0, 2) } as never)
        vi.mocked(carregarLojaDoTema).mockResolvedValue(loja({ produtos: [{ id: 1 }], marcas: [{ id: 1 }] }) as never)
        vi.mocked(produtosIcones).mockReturnValue([{ id: 1 }, { id: 2 }] as never)
        const { container } = await montar()
        expect(container.querySelector('[data-bloco="comidas-artigos"]')).toBeNull()
        expect(bloco(container, 'comidas-destaques-produtos')).toBeNull()
        expect(bloco(container, 'comidas-vitrine')).toBeNull()
        expect(container.querySelector('[data-marcas]')).toBeNull()
        expect(container.querySelector('[data-bloco="comidas-receitas"]')).toBeNull()
    })

    it('com filtro, busca ou página 2 ficam só a lista (e o mapa fora da página 2)', async () => {
        vi.mocked(getPosts).mockResolvedValue({ items: artigos } as never)
        vi.mocked(carregarLojaDoTema).mockResolvedValue(loja() as never)
        configurar([prato(1)], { totalPages: 2 })
        const filtrado = await montar({ search: 'kimchi' })
        expect(filtrado.container.querySelector('[data-destaques]')).toBeNull()
        expect(filtrado.container.querySelector('[data-guia]')).toBeNull()
        expect(filtrado.container.querySelector('[data-loja]')).toBeNull()
        expect(filtrado.container.querySelector('[data-mapa]')).not.toBeNull()
        expect(getPosts).not.toHaveBeenCalled()
        expect(carregarLojaDoTema).not.toHaveBeenCalled()
        cleanup()
        const pagina2 = await montar({ page: '2' })
        expect(pagina2.container.querySelector('[data-mapa]')).toBeNull()
        expect(pagina2.container.querySelector('[data-destaques]')).toBeNull()
    })

    it('região ativa vai ao mapa', async () => {
        expect((await montar({ region: 'busan' })).container.querySelector('[data-mapa]')!.getAttribute('data-mapa')).toBe('busan')
    })

    it('outro idioma não carrega a loja; artigos pedem a categoria no idioma', async () => {
        vi.mocked(temRecurso).mockReturnValue(false)
        vi.mocked(getPosts).mockResolvedValue({ items: artigos } as never)
        vi.mocked(getCategories).mockResolvedValue([{ id: 9, name: 'Comida', slug: 'comida' }] as never)
        const { container } = await montar({}, 'en')
        expect(carregarLojaDoTema).not.toHaveBeenCalled()
        expect(vi.mocked(getPosts).mock.calls[0][0]).toMatchObject({ category: 'comida', lang: 'en' })
        // o rótulo traduzido existe para "comida" no mock
        expect(container.querySelector('[data-guia]')!.getAttribute('data-categorias')).toBe('comida')
    })

    it('falha do WordPress nos artigos ou no acervo de receitas não derruba a página', async () => {
        vi.mocked(getPosts).mockRejectedValue(new Error('wp'))
        vi.mocked(getFoods).mockImplementation((async (p: { perPage?: number }) => {
            if (p.perPage === 100) throw new Error('wp')
            return { items: [prato(1)], total: 1, totalPages: 1 }
        }) as never)
        const { container } = await montar()
        expect(container.querySelector('[data-guia]')).toBeNull()
        expect(container.querySelector('[data-destaques]')!.getAttribute('data-n')).toBe('0')
        expect(container.querySelector('a[href="/comidas/prato-1"]')).not.toBeNull()
    })
})

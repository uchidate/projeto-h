// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { getFoodBySlug, getFoods, getRelatedFoods } from '@/lib/wordpress/foods'
import { getProductionsByIds } from '@/lib/wordpress/productions'
import { getVitrineVinculada } from '@/lib/wordpress/vitrine'
import { getPostsQueCitam } from '@/lib/wordpress/posts'
import { getMencoesNoAcervo } from '@/lib/wordpress/mentions'
import { getReceita } from '@/lib/receitas'
import { temRecurso } from '@/lib/i18n/recursos'
import { semTraducao } from '@/lib/i18n/entity-translation'
import { buildRecipeSchema } from '@/lib/seo/jsonld'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { ADSENSE } from '@/lib/config/ads'
import FoodPage, { generateMetadata, slugsPreGerados } from './FoodDetail'

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))
vi.mock('@/lib/constants/site', () => ({ SITE_NAME: 'HallyuHub', SITE_URL: 'https://site.test' }))
vi.mock('@/lib/i18n/titulo-no-idioma', () => ({ comTituloNoIdioma: (r: unknown) => r }))
vi.mock('@/lib/i18n/alternates', () => ({
    buildAlternates: (r: string, p: { slug: string }, l: string, disp: string[]) => ({ languages: { [l]: `${r}:${p.slug}:${disp.join('+')}` } }),
}))
vi.mock('@/lib/i18n/entity-translation', () => ({
    availableLocales: () => ['pt', 'en'],
    localizeEntity: (e: unknown) => e,
    semTraducao: vi.fn(() => false),
}))
vi.mock('@/lib/i18n/routes', () => ({
    href: (rota: string, params: { slug?: string } | undefined, locale: string) => `/${locale}/${rota}${params?.slug ? `/${params.slug}` : ''}`,
}))
vi.mock('@/lib/i18n/rotulos-ficha', () => ({ rotuloDaCategoriaEm: async (c?: string) => (c ? `cat:${c}` : undefined) }))
vi.mock('@/lib/i18n/recursos', () => ({ temRecurso: vi.fn(() => true) }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: (p: { slot: string }) => <div data-ad={p.slot} /> }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: 'slot-1' as string | undefined } } }))
vi.mock('next/navigation', () => ({
    notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
    default: (p: { src: string; alt: string }) => <img src={p.src} alt={p.alt} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: (p: { href: string; children: ReactNode }) => <a href={p.href}>{p.children}</a>,
}))
vi.mock('@/lib/wordpress/foods', () => ({
    getFoodBySlug: vi.fn(),
    getFoods: vi.fn(),
    getRelatedFoods: vi.fn(),
    FOOD_CATEGORY_EMOJI: { rice: '🍚', soup: '🍲' },
    KOREA_REGIONS: ['Seul', 'Busan'],
}))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionsByIds: vi.fn() }))
vi.mock('@/lib/seo/wordpress', () => ({ buildWordPressMetadata: vi.fn((o: unknown) => ({ capturado: o })) }))
vi.mock('@/lib/seo/jsonld', () => ({
    buildBreadcrumbSchema: (items: unknown) => ({ tipo: 'breadcrumb', items }),
    buildRecipeSchema: vi.fn((o: unknown) => ({ tipo: 'receita', o })),
}))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: { tipo: string } }) => <script data-jsonld={p.data.tipo} /> }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: (p: { postId: number; postType: string }) => <i data-wpedit={`${p.postType}:${p.postId}`} /> }))
vi.mock('@/lib/seo/metaDescription', () => ({
    metaDescriptionComida: (resumo: string, ing?: string[]) => `desc[${resumo}|${(ing ?? []).join(',')}]`,
}))
vi.mock('@/components/ui/LojaEmLinha', () => ({
    LojaEmLinha: (p: { products: { id: number }[]; href: string; bloco: string }) => <div data-loja={p.bloco} data-href={p.href} data-n={p.products.length} />,
}))
vi.mock('@/components/ui/CitadoNoBlog', () => ({ CitadoNoBlog: (p: { posts: unknown[] }) => <div data-citado={p.posts.length} /> }))
vi.mock('@/components/companies/MencionadoAcervo', () => ({ MencionadoAcervo: (p: { mentions: unknown[] }) => <div data-mencoes={p.mentions.length} /> }))
vi.mock('@/components/profiles/ProfileSection', () => ({ ProfileSection: (p: { id: string; children: ReactNode }) => <section data-section={p.id}>{p.children}</section> }))
vi.mock('@/components/food/ReceitaPreparo', () => ({
    ReceitaPreparo: (p: { nome: string; locale: string }) => <div data-receita={p.nome} data-locale={p.locale} />,
}))
vi.mock('@/lib/wordpress/vitrine', () => ({
    getVitrineVinculada: vi.fn(),
    buildVitrineMatcher: async () => (termos: string[]) => termos.includes('Gimbap'),
}))
vi.mock('@/lib/wordpress/posts', () => ({ getPostsQueCitam: vi.fn() }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: vi.fn() }))
vi.mock('@/lib/receitas', () => ({ getReceita: vi.fn() }))

type Obj = Record<string, unknown>
// O mock de ADSENSE é mutável; o tipo real é somente leitura.
const slotsMutaveis = () => ADSENSE.slots as { inline: string | undefined }
const comida = (extra: Obj = {}, acf: Obj = {}) => ({
    id: 10, slug: 'bibimbap', title: { rendered: 'Bibimbap' }, excerpt: { rendered: '<p>Arroz misto.</p>' },
    content: { rendered: '<p>Texto longo.</p>' }, featured_image_url: 'https://img.test/bibimbap.jpg',
    date: '2026-01-01', modified: '2026-02-02', acf, ...extra,
})
const params = (locale?: 'en' | 'pt', slug = 'bibimbap') => Promise.resolve({ slug, locale })
const params2 = (locale?: 'en') => (locale ? params(locale) : params())

async function montar(food: unknown, locale?: 'en') {
    vi.mocked(getFoodBySlug).mockResolvedValue(food as never)
    return render(await FoodPage({ params: params2(locale) }))
}

beforeEach(() => {
    vi.mocked(semTraducao).mockReturnValue(false)
    vi.mocked(temRecurso).mockReturnValue(true)
    vi.mocked(getRelatedFoods).mockResolvedValue([] as never)
    vi.mocked(getProductionsByIds).mockResolvedValue([] as never)
    vi.mocked(getVitrineVinculada).mockResolvedValue([] as never)
    vi.mocked(getPostsQueCitam).mockResolvedValue([] as never)
    vi.mocked(getMencoesNoAcervo).mockResolvedValue([] as never)
    vi.mocked(getReceita).mockResolvedValue(null as never)
    slotsMutaveis().inline = 'slot-1'
})
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('slugsPreGerados', () => {
    it('junta todas as páginas', async () => {
        vi.mocked(getFoods)
            .mockResolvedValueOnce({ items: [{ slug: 'a' }], totalPages: 3 } as never)
            .mockResolvedValueOnce({ items: [{ slug: 'b' }] } as never)
            .mockResolvedValueOnce({ items: [{ slug: 'c' }] } as never)
        expect(await slugsPreGerados()).toEqual([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
        expect(vi.mocked(getFoods).mock.calls.map(c => (c[0] as { page?: number }).page)).toEqual([undefined, 2, 3])
    })

    it('falha do WordPress vira lista vazia', async () => {
        vi.mocked(getFoods).mockRejectedValue(new Error('wp fora'))
        expect(await slugsPreGerados()).toEqual([])
    })
})

describe('generateMetadata', () => {
    it('ficha inexistente: metadata vazia', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(null as never)
        expect(await generateMetadata({ params: params() })).toEqual({})
    })

    it('sem tradução: devolve a versão em português fora do índice', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(comida() as never)
        vi.mocked(semTraducao).mockImplementation(((_: unknown, locale: string) => locale === 'en') as never)
        const m = await generateMetadata({ params: params('en') }) as Obj
        expect(m.robots).toEqual({ index: false, follow: true })
        expect((m.capturado as Obj).url).toBe('https://site.test/pt/food/bibimbap')
    })

    it('título do Rank Math e descrição do Rank Math têm prioridade', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(comida({ meta: { rank_math_title: ' Título RM ', rank_math_description: ' Desc RM ' } }, { name_korean: '비빔밥' }) as never)
        await generateMetadata({ params: params() })
        expect(vi.mocked(buildWordPressMetadata).mock.calls[0][0]).toMatchObject({ title: 'Título RM', description: 'Desc RM' })
    })

    it('sem Rank Math: título com o nome coreano, descrição pelo resumo e ingredientes', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(comida({}, { name_korean: '비빔밥', main_ingredients: ['Arroz', 'Ovo'] }) as never)
        await generateMetadata({ params: params('en') })
        expect(vi.mocked(buildWordPressMetadata).mock.calls[0][0]).toMatchObject({
            title: 'metaTitleKorean~{"name":"Bibimbap","korean":"비빔밥"}',
            description: 'desc[Arroz misto.|Arroz,Ovo]',
            url: 'https://site.test/en/food/bibimbap',
            languages: { en: 'food:bibimbap:pt+en' },
            ogLocale: expect.any(String),
        })
    })

    it('sem coreano e sem resumo: modelos genéricos', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(comida({ excerpt: { rendered: '' }, content: { rendered: '' } }) as never)
        await generateMetadata({ params: params() })
        expect(vi.mocked(buildWordPressMetadata).mock.calls[0][0]).toMatchObject({
            title: 'metaTitle~{"name":"Bibimbap"}',
            description: 'metaDescription~{"name":"Bibimbap"}',
        })
    })
})

describe('FoodPage: cabeçalho', () => {
    it('ficha inexistente vira notFound', async () => {
        vi.mocked(getFoodBySlug).mockResolvedValue(null as never)
        await expect(FoodPage({ params: params() })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('nome, coreano, romanização diferente, categoria, resumo e foto', async () => {
        const { container } = await montar(comida({}, { category: 'rice', name_korean: '비빔밥', name_romanized: 'bibimbab' }))
        expect(container.querySelector('h1')!.textContent).toBe('Bibimbap')
        expect(container.textContent).toContain('비빔밥')
        expect(container.textContent).toContain('bibimbab')
        expect(container.textContent).toContain('🍚 cat:rice')
        expect(container.textContent).toContain('Arroz misto.')
        expect(container.querySelector('img')!.getAttribute('src')).toBe('https://img.test/bibimbap.jpg')
        expect(container.querySelector('[data-wpedit]')!.getAttribute('data-wpedit')).toBe('food:10')
    })

    it('romanização igual ao nome não repete', async () => {
        const { container } = await montar(comida({}, { name_romanized: 'Bibimbap' }))
        expect(container.querySelectorAll('p.italic')).toHaveLength(0)
    })

    it('sem foto: emoji da categoria; crédito só com foto', async () => {
        const semFoto = await montar(comida({ featured_image_url: undefined }, { category: 'soup' }))
        expect(semFoto.container.querySelector('img')).toBeNull()
        expect(semFoto.container.textContent).toContain('🍲')
        cleanup()
        const comCredito = await montar(comida({ _embedded: { 'wp:featuredmedia': [{ source_url: 'https://img.test/x.jpg', caption: { rendered: '<p>Foto: Fulano</p>' } }] } }))
        expect(comCredito.container.textContent).toContain('Foto: Fulano')
    })

    it.each([
        [0, '✅', 'spicy0'],
        [2, '🌶️🌶️', 'spicy2'],
        [4, '🌶️🌶️🌶️', 'spicy4'],
        [9, '🌶️🌶️🌶️', 'spicy5'],
    ])('pimenta %i: ícones %s e rótulo %s', async (n, icones, rotulo) => {
        const { container } = await montar(comida({}, { spicy_level: n }))
        expect(container.textContent).toContain(icones)
        expect(container.textContent).toContain(rotulo)
    })

    it('sem nível informado conta como não picante', async () => {
        const { container } = await montar(comida())
        expect(container.textContent).toContain('✅')
    })

    it('vegano esconde o vegetariano; vegetariano aparece sozinho', async () => {
        const vegano = await montar(comida({}, { is_vegan: true, is_vegetarian: true }))
        expect(vegano.container.textContent).toContain('vegan')
        expect(vegano.container.textContent).not.toContain('vegetarian')
        cleanup()
        const vegetariano = await montar(comida({}, { is_vegetarian: true }))
        expect(vegetariano.container.textContent).toContain('vegetarian')
        expect(vegetariano.container.textContent).not.toContain('🌱')
    })

    it('faixa de preço; região conhecida vira link de filtro, outra fica texto', async () => {
        const conhecida = await montar(comida({}, { price_range: '₩₩', region: 'Seul' }))
        expect(conhecida.container.textContent).toContain('₩₩')
        expect(conhecida.container.querySelector('a[href="/pt/foods?region=Seul"]')).not.toBeNull()
        cleanup()
        const outra = await montar(comida({}, { region: 'Narnia' }))
        expect(outra.container.textContent).toContain('📍 Narnia')
        expect(outra.container.querySelector('a[href*="region="]')).toBeNull()
    })
})

describe('FoodPage: conteúdo', () => {
    it('texto da ficha, receita e anúncio', async () => {
        vi.mocked(getReceita).mockResolvedValue({ passos: [] } as never)
        const { container } = await montar(comida())
        expect(container.querySelector('.wp-article-content')!.textContent).toBe('Texto longo.')
        expect(container.querySelector('[data-receita]')!.getAttribute('data-receita')).toBe('Bibimbap')
        expect(container.querySelector('[data-ad]')!.getAttribute('data-ad')).toBe('slot-1')
        expect(container.querySelector('[data-jsonld="receita"]')).not.toBeNull()
        expect(container.querySelector('[data-jsonld="breadcrumb"]')).not.toBeNull()
    })

    it('sem receita não há bloco nem JSON-LD de receita; sem slot não há anúncio', async () => {
        slotsMutaveis().inline = undefined
        const { container } = await montar(comida())
        expect(container.querySelector('[data-receita]')).toBeNull()
        expect(container.querySelector('[data-jsonld="receita"]')).toBeNull()
        expect(container.querySelector('[data-ad]')).toBeNull()
    })

    it('sem texto no corpo não renderiza o contêiner', async () => {
        const { container } = await montar(comida({ content: { rendered: '' } }))
        expect(container.querySelector('.wp-article-content')).toBeNull()
    })

    it('JSON-LD de receita recebe os dados da ficha', async () => {
        vi.mocked(getReceita).mockResolvedValue({ passos: [] } as never)
        await montar(comida({}, { category: 'rice', region: 'Seul', main_ingredients: ['Arroz'], is_vegan: true, curiosidades: ['x'], name_korean: '비빔밥' }), 'en')
        expect(vi.mocked(buildRecipeSchema).mock.calls[0][0]).toMatchObject({
            name: 'Bibimbap', nameKorean: '비빔밥', description: 'Arroz misto.', url: 'https://site.test/en/food/bibimbap',
            category: 'cat:rice', region: 'Seul', ingredients: ['Arroz'], keywords: ['Bibimbap'], isVegan: true,
            datePublished: '2026-01-01', dateModified: '2026-02-02', locale: 'en',
        })
    })

    it('dramas em que o prato aparece, só quando buscados', async () => {
        vi.mocked(getProductionsByIds).mockResolvedValue([
            { id: 1, slug: 'crash', title: { rendered: 'Crash Landing' }, featured_image_url: 'https://img.test/c.jpg' },
            { id: 2, slug: 'sem-foto', title: { rendered: 'Sem Foto' } },
        ] as never)
        const { container } = await montar(comida({}, { featured_in_dramas: [1, 2] }))
        expect(getProductionsByIds).toHaveBeenCalledWith([1, 2])
        expect(container.textContent).toContain('inDramas')
        expect(container.querySelector('a[href="/pt/production/crash"]')).not.toBeNull()
        expect(container.querySelectorAll('a[href^="/pt/production/"] img')).toHaveLength(1)
        cleanup()
        vi.mocked(getProductionsByIds).mockClear()
        const semDramas = await montar(comida())
        expect(getProductionsByIds).not.toHaveBeenCalled()
        expect(semDramas.container.textContent).not.toContain('inDramas')
    })
})

describe('FoodPage: barra lateral', () => {
    it('ingredientes, curiosidades e alérgenos', async () => {
        const { container } = await montar(comida({}, { main_ingredients: ['Arroz', 'Ovo'], curiosidades: ['Nasceu em Jeonju'], allergens: ['Gergelim'] }))
        const aside = container.querySelector('aside')!.textContent!
        expect(aside).toContain('• Arroz')
        expect(aside).toContain('• Ovo')
        expect(aside).toContain('💡 Nasceu em Jeonju')
        expect(aside).toContain('⚠️ Gergelim')
    })

    it('onde comer: link do mapa com região ou, sem ela, o lugar padrão', async () => {
        const comRegiao = await montar(comida({}, { where_to_find: 'Mercados', region: 'Seul' }))
        expect(comRegiao.container.querySelector('a[target="_blank"]')!.getAttribute('href'))
            .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Bibimbap Seul')}`)
        cleanup()
        const semRegiao = await montar(comida({}, { where_to_find: 'Mercados' }))
        expect(semRegiao.container.querySelector('a[target="_blank"]')!.getAttribute('href'))
            .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Bibimbap defaultPlace')}`)
    })

    it('ocasiões e estações', async () => {
        const { container } = await montar(comida({}, { occasion: ['Chuseok'], season: ['Inverno'] }))
        const aside = container.querySelector('aside')!.textContent!
        expect(aside).toContain('occasion')
        expect(aside).toContain('Chuseok')
        expect(aside).toContain('Inverno')
    })

    it('listas vazias não deixam um "0" solto na página', async () => {
        const { container } = await montar(comida({}, { occasion: [], season: [] }))
        expect(container.querySelector('aside')!.textContent).toBe('')
    })
})

describe('FoodPage: relacionadas, loja e blog', () => {
    const relacionada = (id: number, nome: string, extra: Obj = {}) => ({
        id, slug: nome.toLowerCase(), title: { rendered: nome }, featured_image_url: `https://img.test/${id}.jpg`, acf: {}, ...extra,
    })

    it('relacionadas: cartão, emoji sem foto, coreano e selo "na loja" pelo matcher', async () => {
        vi.mocked(getRelatedFoods).mockResolvedValue([
            relacionada(1, 'Gimbap', { acf: { name_korean: '김밥', category: 'rice' } }),
            relacionada(2, 'Tteok', { featured_image_url: undefined, acf: { category: 'soup' } }),
        ] as never)
        const { container } = await montar(comida({}, { category: 'rice' }))
        expect(getRelatedFoods).toHaveBeenCalledWith(10, 'rice', 6)
        const sec = container.querySelector('[data-section="relacionadas"]')!
        expect(sec.textContent).toContain('김밥')
        expect(sec.querySelectorAll('img')).toHaveLength(1)
        expect(sec.textContent).toContain('🍲')
        expect(sec.textContent!.match(/inStore/g)).toHaveLength(1)
        expect(sec.querySelector('a[href="/pt/food/gimbap"]')).not.toBeNull()
        expect(sec.querySelector('a[href="/pt/foods"]')!.textContent).toBe('seeAll')
    })

    it('sem relacionadas a seção some; fora do português o selo "na loja" não aparece', async () => {
        const vazio = await montar(comida())
        expect(vazio.container.querySelector('[data-section="relacionadas"]')).toBeNull()
        cleanup()
        vi.mocked(temRecurso).mockReturnValue(false)
        vi.mocked(getRelatedFoods).mockResolvedValue([relacionada(1, 'Gimbap')] as never)
        const en = await montar(comida(), 'en')
        expect(en.container.textContent).not.toContain('inStore')
    })

    it('loja, blog e menções: a seção aparece se qualquer um tiver conteúdo', async () => {
        vi.mocked(getPostsQueCitam).mockResolvedValue([{ id: 1 }, { id: 2 }] as never)
        const { container } = await montar(comida())
        expect(container.querySelector('[data-section="loja-blog"]')).not.toBeNull()
        expect(container.querySelector('[data-loja]')!.getAttribute('data-href')).toBe('/loja/comida/bibimbap')
        expect(container.querySelector('[data-citado]')!.getAttribute('data-citado')).toBe('2')
        expect(getMencoesNoAcervo).toHaveBeenCalledWith('Bibimbap', 3, { excluirCpt: 'food', excluirSlug: 'bibimbap' })
    })

    it('tudo vazio, ou sem o recurso de loja: a seção some', async () => {
        const vazio = await montar(comida())
        expect(vazio.container.querySelector('[data-section="loja-blog"]')).toBeNull()
        cleanup()
        vi.mocked(temRecurso).mockReturnValue(false)
        vi.mocked(getVitrineVinculada).mockResolvedValue([{ id: 1 }] as never)
        const semLoja = await montar(comida(), 'en')
        expect(semLoja.container.querySelector('[data-section="loja-blog"]')).toBeNull()
    })

    it('a vitrine é buscada com o nome e os ingredientes', async () => {
        await montar(comida({}, { main_ingredients: ['Arroz'], linked_products: [5] }))
        expect(getVitrineVinculada).toHaveBeenCalledWith([5], ['Bibimbap', 'Arroz'], 'comida:bibimbap', { temas: ['culinaria'] })
    })
})

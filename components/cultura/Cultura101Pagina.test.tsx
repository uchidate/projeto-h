// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import trilhasData from '@/lib/cultura/trilhas.json'
import { SITE_URL } from '@/lib/constants/site'
import { ADSENSE } from '@/lib/config/ads'
import { getCategories, getPostBySlug, getPosts } from '@/lib/wordpress/posts'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { postsTraduzidosPorSlugPt } from '@/lib/cultura/guias-traduzidos'
import CulturaCoreanaPage, { buildCulturaMetadata } from './Cultura101Pagina'

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))
vi.mock('@/lib/wordpress/posts', () => ({
    getPosts: vi.fn(),
    getPostBySlug: vi.fn(),
    getCategories: vi.fn(),
}))
vi.mock('@/lib/wordpress/site-settings', () => ({ getSiteSettings: vi.fn() }))
vi.mock('@/lib/cultura/guias-traduzidos', () => ({ postsTraduzidosPorSlugPt: vi.fn() }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: 'in' as string | undefined } } }))

vi.mock('next/image', () => ({
    default: ({ src }: { src: string }) => (
        // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
        <img src={src} alt="" />
    ),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: ({ analyticsPlacement }: { analyticsPlacement: string }) => <div data-ad={analyticsPlacement} />,
}))
vi.mock('@/components/cultura/HubBusca', () => ({
    HubBusca: ({ itens }: { itens: { rotulo: string; href: string }[] }) => (
        <div data-busca={itens.map(i => i.href).join(' ; ')} />
    ),
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => <div data-crumb /> }))
vi.mock('@/components/seo/JsonLd', () => ({
    JsonLd: ({ data }: { data: unknown }) => <script data-jsonld>{JSON.stringify(data)}</script>,
}))

const slots = ADSENSE.slots as { inline?: string }

const [INICIO_A, INICIO_B] = trilhasData.inicio
const LANG = trilhasData.trilhas[0].slugs
const TRADICOES = trilhasData.trilhas[1].slugs

const guia = (slug: string, label = `Guia ${slug}`) => ({ label, href: `/blog/${slug}`, emoji: '📘' })

function post(id: number, over: Record<string, unknown> = {}) {
    return {
        id,
        slug: `post-${id}`,
        date: '2026-11-01T10:00:00',
        title: { rendered: `Reportagem ${id}` },
        excerpt: { rendered: '<p>Resumo do excerpt</p>' },
        featured_image_url: `https://img.test/${id}.jpg`,
        categories: [],
        ...over,
    }
}

function configurar({
    guias = [] as ReturnType<typeof guia>[],
    reportagens = [] as unknown[],
    categorias = [] as { id: number; slug: string }[],
    capa = null as unknown,
    traduzidos = new Map<string, unknown>(),
} = {}) {
    vi.mocked(getSiteSettings).mockResolvedValue({ cultureGuides: guias } as never)
    vi.mocked(getPosts).mockResolvedValue({ items: reportagens, total: reportagens.length, totalPages: 1 } as never)
    vi.mocked(getCategories).mockResolvedValue(categorias as never)
    vi.mocked(getPostBySlug).mockResolvedValue(capa as never)
    vi.mocked(postsTraduzidosPorSlugPt).mockResolvedValue(traduzidos as never)
}

async function montar(locale?: 'en') {
    return render(await CulturaCoreanaPage({ locale }))
}

const hrefs = (c: ParentNode) => Array.from(c.querySelectorAll('a')).map(a => a.getAttribute('href'))
const secao = (c: HTMLElement, aria: string) => c.querySelector(`section[aria-label="${aria}"]`)

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // Meio do dia em UTC: é o mesmo dia em Brasília em qualquer fuso do computador que roda o teste.
    vi.setSystemTime(new Date('2027-01-10T15:00:00Z'))
    slots.inline = 'in'
    configurar()
})
afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
})

describe('Cultura101Pagina: guias e trilhas', () => {
    it('agrupa guias nas trilhas do JSON e põe o que sobra em "more"', async () => {
        configurar({ guias: [guia(LANG[0]), guia(TRADICOES[0]), guia('guia-novo-fora-do-mapa')] })
        const { container } = await montar()
        const titulos = Array.from(container.querySelectorAll('h3')).map(h => h.textContent)
        expect(titulos).toEqual([
            'trails.language1',
            'trails.traditions1',
            'trails.more1',
        ])
    })

    it('guias do "comece por aqui" saem das trilhas e ganham destaque', async () => {
        configurar({ guias: [guia(INICIO_A), guia(INICIO_B), guia(LANG[0])] })
        const { container } = await montar()
        const destaques = Array.from(container.querySelectorAll('a')).filter(a => a.textContent?.includes('startHere'))
        expect(destaques.map(a => a.getAttribute('href'))).toEqual([`/blog/${INICIO_A}`, `/blog/${INICIO_B}`])
        // só a trilha "language" existe, com 1 guia (os de início não entram)
        expect(Array.from(container.querySelectorAll('h3')).map(h => h.textContent)).toEqual(['trails.language1'])
    })

    it('trilha com mais de 5 guias recolhe o resto num details', async () => {
        configurar({ guias: TRADICOES.slice(0, 8).map(s => guia(s)) })
        const { container } = await montar()
        const lis = container.querySelectorAll('h3 ~ ul > li')
        expect(lis).toHaveLength(5)
        const det = container.querySelector('details')!
        expect(det.querySelectorAll('li')).toHaveLength(3)
        expect(det.textContent).toContain('"count":3')
    })

    it('sem guias não há seção de guias, anúncio nem atalho "guias"', async () => {
        configurar({ guias: [] })
        const { container } = await montar()
        expect(container.querySelector('section[aria-label="guidesAria"]')).toBeNull()
        expect(container.querySelector('[data-ad]')).toBeNull()
        expect(container.querySelector('nav a[href="#guias"]')).toBeNull()
        expect(container.querySelector('nav a[href="#festas"]')).not.toBeNull()
    })

    it('contagem, busca e atalhos refletem os guias', async () => {
        configurar({ guias: [guia(LANG[0]), guia(LANG[1])] })
        const { container } = await montar()
        expect(container.textContent).toContain('count~{"count":2}')
        expect(container.querySelector('[data-busca]')!.getAttribute('data-busca')).toBe(`/blog/${LANG[0]} ; /blog/${LANG[1]}`)
        expect(container.querySelector('nav a[href="#guias"]')).not.toBeNull()
    })

    it('anúncio só com slot inline e guias', async () => {
        configurar({ guias: [guia(LANG[0])] })
        expect((await montar()).container.querySelector('[data-ad="cultura_101"]')).not.toBeNull()
        cleanup()
        slots.inline = undefined
        expect((await montar()).container.querySelector('[data-ad]')).toBeNull()
    })
})

describe('Cultura101Pagina: capas e resumos do início (pt)', () => {
    it('usa capa e subtítulo do post; sem subtítulo cai no excerpt sem HTML', async () => {
        configurar({
            guias: [guia(INICIO_A), guia(INICIO_B)],
            capa: post(1, { acf: { subtitle: '  Um subtítulo ' } }),
        })
        const a = await montar()
        const destaque = a.container.querySelector(`a[href="/blog/${INICIO_A}"]`)!
        expect(destaque.querySelector('img')!.getAttribute('src')).toBe('https://img.test/1.jpg')
        expect(destaque.textContent).toContain('Um subtítulo')
        a.unmount()
        configurar({ guias: [guia(INICIO_A)], capa: post(1) })
        const b = await montar()
        expect(b.container.querySelector(`a[href="/blog/${INICIO_A}"]`)!.textContent).toContain('Resumo do excerpt')
    })

    it('post sem imagem: o destaque aparece sem capa', async () => {
        configurar({ guias: [guia(INICIO_A)], capa: post(1, { featured_image_url: undefined }) })
        const { container } = await montar()
        expect(container.querySelector(`a[href="/blog/${INICIO_A}"] img`)).toBeNull()
    })

    it('busca de capa que falha não derruba a página', async () => {
        configurar({ guias: [guia(INICIO_A)] })
        vi.mocked(getPostBySlug).mockRejectedValue(new Error('wp fora'))
        const { container } = await montar()
        expect(container.querySelector(`a[href="/blog/${INICIO_A}"]`)).not.toBeNull()
    })
})

describe('Cultura101Pagina: reportagens', () => {
    it('exclui guias, outros temas e posts sem imagem, e limita a 4', async () => {
        configurar({
            guias: [guia('post-1', 'Guia 1')],
            categorias: [{ id: 9, slug: 'comida' }, { id: 8, slug: 'outra' }],
            reportagens: [
                post(1), // é guia
                post(2, { categories: [9] }), // comida
                post(3, { featured_image_url: undefined }), // sem imagem
                post(4, { categories: [8] }),
                post(5), post(6), post(7), post(8),
            ],
        })
        const { container } = await montar()
        const links = hrefs(container).filter(h => h?.startsWith('/blog/post-'))
        // post-1 aparece uma vez só: como guia, não se repete nas reportagens
        expect(links).toEqual(['/blog/post-1', '/blog/post-4', '/blog/post-5', '/blog/post-6', '/blog/post-7'])
    })

    it('falha em categorias e posts não derruba a página', async () => {
        configurar({ guias: [guia(LANG[0])] })
        vi.mocked(getCategories).mockRejectedValue(new Error('x'))
        vi.mocked(getPosts).mockRejectedValue(new Error('y'))
        const { container } = await montar()
        expect(container.querySelector('h1')).not.toBeNull()
        expect(container.textContent).not.toContain('reports')
    })

    it('links "ver todos" sempre presentes com guias', async () => {
        configurar({ guias: [guia(LANG[0])] })
        const links = hrefs((await montar()).container)
        expect(links).toContain('/guias')
        expect(links).toContain('/blog?category=cultura')
    })
})

describe('Cultura101Pagina: festas', () => {
    it('lista as 4 próximas a partir de hoje, com dias restantes', async () => {
        const { container } = await montar()
        const sec = secao(container, 'festivalsAria')!
        const itens = Array.from(sec.querySelectorAll('li'))
        expect(itens).toHaveLength(4)
        expect(itens[0].textContent).toContain('Seollal')
        expect(itens[0].textContent).toContain('"days":28')
        expect(itens[0].textContent).toContain('festivals.lunarNewYear')
    })

    it('no dia diz "today" e no dia anterior "tomorrow"', async () => {
        vi.setSystemTime(new Date('2027-02-06T15:00:00Z'))
        const a = await montar()
        expect(secao(a.container, 'festivalsAria')!.querySelector('li')!.textContent).toContain('tomorrow')
        a.unmount()
        vi.setSystemTime(new Date('2027-02-07T15:00:00Z'))
        const b = await montar()
        expect(secao(b.container, 'festivalsAria')!.querySelector('li')!.textContent).toContain('today')
    })

    it('festa com guia vira link; sem guia, bloco simples', async () => {
        const { container } = await montar()
        const [seollal, daeboreum] = Array.from(secao(container, 'festivalsAria')!.querySelectorAll('li'))
        expect(seollal.querySelector('a')!.getAttribute('href')).toBe('/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas')
        expect(daeboreum.querySelector('a')).toBeNull()
    })

    it('festas passadas somem e a lista esgotada esconde o bloco e o atalho', async () => {
        vi.setSystemTime(new Date(2029, 0, 1))
        const { container } = await montar()
        expect(secao(container, 'festivalsAria')).toBeNull()
        expect(container.querySelector('nav a[href="#festas"]')).toBeNull()
    })

    it('capítulos são numerados na ordem em que aparecem', async () => {
        configurar({ guias: [guia(LANG[0])] })
        const { container } = await montar()
        const caps = Array.from(container.querySelectorAll('h2')).map(h => h.textContent)
        expect(caps).toEqual(['01 · chapterTitle', '02 · festivalsTitle'])
    })

    it('sem guias, festas vira o capítulo 01', async () => {
        const { container } = await montar()
        expect(Array.from(container.querySelectorAll('h2')).map(h => h.textContent)).toEqual(['01 · festivalsTitle'])
    })
})

describe('Cultura101Pagina: outros temas e idioma', () => {
    it('em pt mostra comida e merch', async () => {
        const links = hrefs((await montar()).container)
        expect(links).toContain('/comidas')
        expect(links).toContain('/merch')
    })

    it('em en tira o merch e só usa guias com tradução publicada, com o título traduzido', async () => {
        configurar({
            guias: [guia(LANG[0], 'Original A'), guia(LANG[1], 'Original B')],
            traduzidos: new Map([[LANG[0], post(1, { title: { rendered: 'Translated A' } })]]),
        })
        const { container } = await montar('en')
        const links = hrefs(container)
        expect(links).not.toContain('/merch')
        expect(links).toContain(`/blog/${LANG[0]}`)
        expect(links).not.toContain(`/blog/${LANG[1]}`)
        expect(container.textContent).toContain('Translated A')
        expect(container.textContent).not.toContain('Original B')
        expect(getPostBySlug).not.toHaveBeenCalled()
        expect(vi.mocked(getPosts).mock.calls[0][0]).toMatchObject({ lang: 'en' })
    })

    it('em en as capas vêm dos posts traduzidos', async () => {
        configurar({
            guias: [guia(INICIO_A)],
            traduzidos: new Map([[INICIO_A, post(7)]]),
        })
        const { container } = await montar('en')
        expect(container.querySelector(`a[href="/blog/${INICIO_A}"] img`)!.getAttribute('src')).toBe('https://img.test/7.jpg')
    })

    it('JSON-LD: CollectionPage com a url do idioma', async () => {
        const pt = JSON.parse((await montar()).container.querySelector('[data-jsonld]')!.textContent!)
        expect(pt['@type']).toBe('CollectionPage')
        expect(pt.url.startsWith(SITE_URL)).toBe(true)
        cleanup()
        const en = JSON.parse((await montar('en')).container.querySelector('[data-jsonld]')!.textContent!)
        expect(en.url).not.toBe(pt.url)
        expect(en.url).toContain('/en')
    })
})

describe('buildCulturaMetadata', () => {
    it('título, descrição e OG com a url do idioma', async () => {
        const m = await buildCulturaMetadata('en')
        expect(m.title).toBe('title')
        expect(m.description).toBe('description')
        expect((m.openGraph as { url?: string }).url).toContain('/en')
    })

    it('idioma padrão usa a url sem prefixo', async () => {
        const m = await buildCulturaMetadata()
        expect((m.openGraph as { url?: string }).url?.startsWith(SITE_URL)).toBe(true)
        expect((m.openGraph as { url?: string }).url).not.toContain('/en')
    })
})

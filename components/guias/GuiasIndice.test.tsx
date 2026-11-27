// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que o índice /guias decide: filtro por tipo (?kind=), seções e capítulos, "ver mais" depois de 6,
// grupo "mais lidos", faixa de entrada só sem filtro (e sem derrubar a página se o WP falhar), outro idioma
// (só guia traduzido, grupo vazio some), anúncio entre seções e metadados.
const getGruposDeGuias = vi.fn()
const getMapaDeGuias = vi.fn()
const getSiteSettings = vi.fn()
const carregarGuiasPorTema = vi.fn()
const carregarPassos = vi.fn()
const postsTraduzidosPorSlugPt = vi.fn()
const ads = vi.hoisted(() => ({ ADSENSE: { slots: { inline: 'slot-1' as string | undefined } } }))

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/guias', () => ({ getGruposDeGuias: (...a: unknown[]) => getGruposDeGuias(...a) }))
vi.mock('@/lib/guias/i18n', () => ({ getMapaDeGuias: (...a: unknown[]) => getMapaDeGuias(...a) }))
const visitas = vi.hoisted(() => ({ 'g-top': 900, 'g-meio': 500, 'g-baixo': 100 }) as Record<string, number>)
vi.mock('@/lib/guias/demanda', () => ({
    VISITAS_POR_GUIA: visitas,
    porDemanda: <T extends { slug: string }>(hubs: T[]) => [...hubs].sort((a, b) => (visitas[b.slug] ?? 0) - (visitas[a.slug] ?? 0)),
    resumoDoGuia: (curto: string, descricao: string) => (descricao && descricao !== curto ? descricao : ''),
}))
vi.mock('@/lib/wordpress/site-settings', () => ({ getSiteSettings: (...a: unknown[]) => getSiteSettings(...a) }))
vi.mock('@/lib/home/guias', () => ({
    carregarGuiasPorTema: (...a: unknown[]) => carregarGuiasPorTema(...a),
    carregarPassos: (...a: unknown[]) => carregarPassos(...a),
}))
vi.mock('@/lib/cultura/guias-traduzidos', () => ({ postsTraduzidosPorSlugPt: (...a: unknown[]) => postsTraduzidosPorSlugPt(...a) }))
vi.mock('@/lib/config/ads', () => ads)
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-anuncio /> }))
vi.mock('@/components/home/HomeGuias', () => ({
    HomeGuias: (p: { passos: unknown[]; guias: unknown[] }) => <div data-home-guias data-passos={p.passos.length} data-guias={p.guias.length} />,
}))
vi.mock('@/components/cultura/HubBusca', () => ({
    HubBusca: (p: { itens: unknown[]; sugestoes: unknown[] }) => <div data-busca data-itens={JSON.stringify(p.itens)} data-sugestoes={JSON.stringify(p.sugestoes)} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import { GuiasIndice, buildGuiasMetadata } from './GuiasIndice'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Hub = { slug: string; kind: 'productions' | 'artists' | 'groups'; shortTitle: string; description: string; keywords: string[] }
const hub = (slug: string, kind: Hub['kind'], extra: Partial<Hub> = {}): Hub => ({ slug, kind, shortTitle: `Guia ${slug}`, description: '', keywords: [], ...extra })

const HUBS: Hub[] = [
    hub('g-top', 'productions'), hub('g-meio', 'productions'), hub('g-baixo', 'artists'), hub('g-grupo', 'groups'),
]
const grupos = (hubs: Hub[]) => (['productions', 'artists', 'groups'] as const).map((kind) => ({
    kind,
    grupos: hubs.some((h) => h.kind === kind) ? [{ id: 'genre', hubs: hubs.filter((h) => h.kind === kind) }] : [],
}))

function mapaDe(hubs: Hub[], extra: Record<string, unknown> = {}) {
    return {
        hubs,
        traduzidos: () => hubs.map((h) => h.slug),
        localizar: () => null,
        slugPublico: () => null,
        alternativasDoIndice: () => null,
        ...extra,
    }
}

async function montar(kind?: string, locale = DEFAULT_LOCALE) {
    return render(await GuiasIndice({ kind, locale }))
}

beforeEach(() => {
    vi.clearAllMocks()
    ads.ADSENSE.slots.inline = 'slot-1'
    getMapaDeGuias.mockResolvedValue(mapaDe(HUBS))
    getGruposDeGuias.mockResolvedValue(grupos(HUBS))
    getSiteSettings.mockResolvedValue({ cultureGuides: [{ label: 'Hanbok', href: '/blog/hanbok' }, { label: 'Kimchi', href: '/blog/kimchi' }] })
    carregarGuiasPorTema.mockResolvedValue([{ id: 1 }])
    carregarPassos.mockResolvedValue([])
    postsTraduzidosPorSlugPt.mockResolvedValue(new Map())
})
afterEach(cleanup)

describe('GuiasIndice — sem filtro', () => {
    it('mostra uma seção por tipo, com capítulo numerado e índice fixo', async () => {
        const { container } = await montar()
        expect([...container.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['01 · kinds.productions', '02 · kinds.artists', '03 · kinds.groups'])
        const indice = container.querySelector('nav[aria-label="sectionsAria"]')!
        expect([...indice.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['#productions', '#artists', '#groups'])
    })

    it('filtros: "todos", um por tipo com guia, e o atalho para Cultura 101', async () => {
        const { container } = await montar()
        const nav = container.querySelector('nav[aria-label="categoriesAria"]')!
        expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
            '/guias', '/guias?kind=productions', '/guias?kind=artists', '/guias?kind=groups', '/cultura-coreana-101',
        ])
        expect(nav.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe('/guias')
    })

    it('tipo sem nenhum guia não ganha filtro nem seção', async () => {
        const so = HUBS.filter((h) => h.kind !== 'artists')
        getMapaDeGuias.mockResolvedValue(mapaDe(so))
        getGruposDeGuias.mockResolvedValue(grupos(so))
        const { container } = await montar()
        const hrefs = [...container.querySelectorAll('nav[aria-label="categoriesAria"] a')].map((a) => a.getAttribute('href'))
        expect(hrefs).not.toContain('/guias?kind=artists')
        expect(container.querySelector('#artists')).toBeNull()
    })

    it('contagem inclui a cultura quando há; sem cultura usa só os guias', async () => {
        const { container } = await montar()
        expect(container.querySelector('p.text-muted')?.textContent).toBe('countWithCulture~{"count":4,"culture":2}')
        cleanup()
        getSiteSettings.mockResolvedValue({ cultureGuides: [] })
        const sem = await montar()
        expect(sem.container.querySelector('p.text-muted')?.textContent).toBe('count~{"count":4}')
    })

    it('faixa de entrada leva passos da cultura e guias por tema', async () => {
        const { container } = await montar()
        const faixa = container.querySelector('[data-home-guias]')!
        expect(faixa.getAttribute('data-passos')).toBe('2')
        expect(faixa.getAttribute('data-guias')).toBe('1')
    })

    it('se o WordPress falhar, a página sai sem a faixa e sem contagem de cultura', async () => {
        getSiteSettings.mockRejectedValue(new Error('WP'))
        carregarGuiasPorTema.mockRejectedValue(new Error('WP'))
        const { container } = await montar()
        expect(container.querySelector('[data-home-guias]')).toBeNull()
        expect(container.querySelectorAll('section[aria-label]').length).toBe(3)
        expect(container.querySelector('p.text-muted')?.textContent).toBe('count~{"count":4}')
    })

    it('card final leva à Cultura 101; com cultura zerada o texto cai em "cultureMany"', async () => {
        getSiteSettings.mockResolvedValue({ cultureGuides: [] })
        const { container } = await montar()
        const card = [...container.querySelectorAll('a')].filter((a) => a.getAttribute('href') === '/cultura-coreana-101').pop()!
        expect(card.textContent).toContain('cultureText~{"count":"cultureMany"}')
    })

    it('o grupo "mais lidos" entra em Grupos, com no máximo os guias que têm visita, por demanda', async () => {
        const { container } = await montar()
        const secao = container.querySelector('section[aria-label="kinds.groups"]')!
        const titulos = [...secao.querySelectorAll('h3')].map((h) => h.textContent)
        expect(titulos[titulos.length - 1]).toContain('mostRead')
        const maisLidos = secao.querySelectorAll('h3')[titulos.length - 1].parentElement!
        expect([...maisLidos.querySelectorAll('li a')].map((a) => a.getAttribute('href'))).toEqual(['/guias/g-top', '/guias/g-meio', '/guias/g-baixo'])
    })

    it('a busca recebe todos os guias e os de cultura; sugestões são os 3 mais lidos', async () => {
        const { container } = await montar()
        const busca = container.querySelector('[data-busca]')!
        const itens = JSON.parse(busca.getAttribute('data-itens')!) as { rotulo: string; tipo: string }[]
        expect(itens.map((i) => i.rotulo)).toEqual(['Guia g-top', 'Guia g-meio', 'Guia g-baixo', 'Guia g-grupo', 'Hanbok', 'Kimchi'])
        expect(itens.at(-1)?.tipo).toBe('cultureTag')
        expect(JSON.parse(busca.getAttribute('data-sugestoes')!)).toHaveLength(3)
    })
})

describe('GuiasIndice — ?kind=', () => {
    it('mostra só o tipo pedido, sem índice, faixa de entrada, "mais lidos" nem card de cultura', async () => {
        const { container } = await montar('artists')
        expect(container.querySelectorAll('section[aria-label]')).toHaveLength(1)
        expect(container.querySelector('#artists')).not.toBeNull()
        expect(container.querySelector('nav[aria-label="sectionsAria"]')).toBeNull()
        expect(container.querySelector('[data-home-guias]')).toBeNull()
        expect(container.textContent).not.toContain('cultureTitle')
        expect(container.querySelector('p.text-muted')?.textContent).toBe('count~{"count":1}')
        expect(getSiteSettings).not.toHaveBeenCalled()
        expect(carregarGuiasPorTema).not.toHaveBeenCalled()
    })

    it('o filtro ativo ganha aria-current', async () => {
        const { container } = await montar('groups')
        expect(container.querySelector('nav[aria-label="categoriesAria"] a[aria-current="page"]')?.getAttribute('href')).toBe('/guias?kind=groups')
    })

    it('tipo desconhecido é tratado como sem filtro', async () => {
        const { container } = await montar('lixo')
        expect(container.querySelectorAll('section[aria-label]')).toHaveLength(3)
    })
})

describe('GuiasIndice — lista dentro do grupo', () => {
    const muitos = Array.from({ length: 9 }, (_, i) => hub(`prod-${i}`, 'productions'))

    it('mostra 6 e esconde o resto num "ver mais" com a contagem', async () => {
        getMapaDeGuias.mockResolvedValue(mapaDe(muitos))
        getGruposDeGuias.mockResolvedValue(grupos(muitos))
        const { container } = await montar('productions')
        const grupo = container.querySelector('section[aria-label="kinds.productions"] h3')!.parentElement!
        const direto = [...grupo.querySelector(':scope > ul')!.querySelectorAll('li')]
        expect(direto).toHaveLength(6)
        expect(grupo.querySelector('details ul')!.querySelectorAll('li')).toHaveLength(3)
        expect(grupo.querySelector('summary')!.textContent).toContain('more~{"count":3}')
    })

    it('até 6 guias não têm "ver mais"', async () => {
        const { container } = await montar('productions')
        expect(container.querySelector('details')).toBeNull()
    })

    it('mostra o resumo do guia só quando ele difere do título curto', async () => {
        const comResumo = [hub('com', 'productions', { description: 'Resumo longo' }), hub('sem', 'productions')]
        getMapaDeGuias.mockResolvedValue(mapaDe(comResumo))
        getGruposDeGuias.mockResolvedValue(grupos(comResumo))
        const { container } = await montar('productions')
        const links = [...container.querySelectorAll('li a')]
        expect(links.find((a) => a.getAttribute('href') === '/guias/com')?.textContent).toContain('Resumo longo')
        expect(links.find((a) => a.getAttribute('href') === '/guias/sem')?.textContent).toBe('Guia sem')
    })
})

describe('GuiasIndice — anúncio', () => {
    it('um anúncio entre cada seção (nunca antes da primeira)', async () => {
        const { container } = await montar()
        expect(container.querySelectorAll('[data-anuncio]')).toHaveLength(2)
    })

    it('sem slot configurado, ou com filtro (uma seção só), não há anúncio', async () => {
        ads.ADSENSE.slots.inline = undefined
        expect((await montar()).container.querySelectorAll('[data-anuncio]')).toHaveLength(0)
        cleanup()
        ads.ADSENSE.slots.inline = 'slot-1'
        expect((await montar('artists')).container.querySelectorAll('[data-anuncio]')).toHaveLength(0)
    })
})

describe.skipIf(!OUTRO)('GuiasIndice — outro idioma', () => {
    it('só guias traduzidos, com texto e URL do idioma; seção vazia some', async () => {
        getMapaDeGuias.mockResolvedValue(mapaDe(HUBS, {
            traduzidos: () => ['g-top'],
            localizar: (h: Hub) => (h.slug === 'g-top' ? { ...h, shortTitle: 'Top guide' } : null),
            slugPublico: (slug: string) => (slug === 'g-top' ? 'top-guide' : null),
        }))
        const { container } = await montar(undefined, OUTRO!)
        const links = [...container.querySelectorAll('section li a')]
        expect(links).toHaveLength(1)
        expect(links[0].textContent).toBe('Top guide')
        expect(links[0].getAttribute('href')).toContain('top-guide')
        expect(container.querySelector('#artists')).toBeNull()
        expect(container.querySelector('#groups')).toBeNull()
    })

    it('a trilha de cultura usa os posts com versão no idioma', async () => {
        carregarPassos.mockResolvedValue([{ label: 'Hanbok', href: '/en/blog/hanbok' }])
        postsTraduzidosPorSlugPt.mockResolvedValue(new Map([['hanbok', {}]]))
        const { container } = await montar(undefined, OUTRO!)
        expect(container.querySelector('[data-home-guias]')?.getAttribute('data-passos')).toBe('1')
        expect(postsTraduzidosPorSlugPt).toHaveBeenCalledWith(OUTRO, ['hanbok', 'kimchi'])
    })

    it('com ?kind= não há passos e nenhuma busca de tradução da cultura é feita', async () => {
        await montar('artists', OUTRO!)
        expect(carregarPassos).not.toHaveBeenCalled()
        expect(postsTraduzidosPorSlugPt).not.toHaveBeenCalled()
    })

    it('se carregar os passos falhar, a página sai sem eles', async () => {
        carregarPassos.mockRejectedValue(new Error('WP'))
        const { container } = await montar(undefined, OUTRO!)
        expect(container.querySelector('[data-home-guias]')?.getAttribute('data-passos')).toBe('0')
    })
})

describe('buildGuiasMetadata', () => {
    it('canônica /guias e idiomas do mapa quando existem', async () => {
        getMapaDeGuias.mockResolvedValue(mapaDe(HUBS, { alternativasDoIndice: () => ({ 'en-US': 'https://x.test/en/guides' }) }))
        const m = await buildGuiasMetadata()
        expect(String(m.alternates?.canonical)).toMatch(/\/guias$/)
        expect(m.alternates?.languages).toEqual({ 'en-US': 'https://x.test/en/guides' })
    })

    it('sem alternativas, declara só o idioma padrão', async () => {
        const m = await buildGuiasMetadata()
        expect(Object.keys(m.alternates?.languages ?? {})).toHaveLength(1)
    })
})

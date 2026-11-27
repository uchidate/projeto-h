// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { WPGroup } from '@/lib/wordpress/types'
import { GENERATIONS } from '@/lib/constants/generations'
import { SITE_URL } from '@/lib/constants/site'
import { ADSENSE } from '@/lib/config/ads'
import { temRecurso } from '@/lib/i18n/recursos'
import { GroupCard, GroupsPage } from './GroupsPage'

// ADSENSE.slots é somente leitura nos tipos; o mock acima o deixa mutável.
const slots = ADSENSE.slots as { leaderboard?: string; inline?: string }

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))

vi.mock('@/lib/config/ads', () => ({
    ADSENSE: { slots: { leaderboard: 'lb' as string | undefined, inline: 'in' as string | undefined } },
}))

vi.mock('@/lib/i18n/recursos', () => ({ temRecurso: vi.fn(() => true) }))

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
        // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
        <img src={src} alt={alt} />
    ),
}))

vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode; 'aria-disabled'?: boolean; 'data-posicao'?: number }) => (
        <a href={href} aria-disabled={rest['aria-disabled']} data-posicao={rest['data-posicao']}>{children}</a>
    ),
}))

vi.mock('@/components/ui/BarraAncorada', () => ({
    BarraAncorada: ({ children }: { children: ReactNode }) => <div data-barra>{children}</div>,
}))
vi.mock('@/components/artists/lista/ContinueDeOndeParou', () => ({ ContinueDeOndeParou: () => <div data-continue /> }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({ ShopRelatedSection: () => <div data-shop /> }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))
vi.mock('@/components/ui/SearchInput', () => ({
    SearchInput: ({ current }: { current?: string }) => <input data-search defaultValue={current ?? ''} />,
}))
vi.mock('@/components/ui/Pagination', () => ({
    Pagination: ({ currentPage, buildHref }: { currentPage: number; buildHref: (p: number) => string }) => (
        <nav data-pagination data-next={buildHref(currentPage + 1)} />
    ),
}))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: ({ analyticsPlacement }: { analyticsPlacement: string }) => <div data-ad={analyticsPlacement} />,
}))
vi.mock('@/components/seo/JsonLd', () => ({
    JsonLd: ({ data }: { data: unknown }) => <script data-jsonld>{JSON.stringify(data)}</script>,
}))
vi.mock('@/components/ui/EmptyState', () => ({
    EmptyState: ({ title, description }: { title: string; description: string }) => (
        <div data-empty>{title}|{description}</div>
    ),
}))

type Props = Parameters<typeof GroupsPage>[0]

function grupo(id: number, acf: Record<string, unknown> = {}, extra: Record<string, unknown> = {}): WPGroup {
    return {
        id,
        slug: `grupo-${id}`,
        title: { rendered: `Grupo ${id}` },
        featured_image_url: `https://img.test/${id}.jpg`,
        acf,
        ...extra,
    } as unknown as WPGroup
}

const lista = (n: number, de = 1) => Array.from({ length: n }, (_, i) => grupo(de + i))

async function montar(over: Partial<Props> = {}) {
    const props: Props = {
        groups: lista(3),
        total: 3,
        totalPages: 1,
        currentPage: 1,
        letterCounts: {},
        ...over,
    }
    return render(await GroupsPage(props))
}

const bloco = (c: HTMLElement, nome: string) => c.querySelector(`[data-bloco="${nome}"]`)
const hrefs = (el: ParentNode | null) => Array.from(el?.querySelectorAll('a') ?? []).map(a => a.getAttribute('href'))

beforeEach(() => {
    slots.leaderboard = 'lb'
    slots.inline = 'in'
    vi.mocked(temRecurso).mockReturnValue(true)
})
afterEach(cleanup)

describe('GroupsPage: início x filtrado', () => {
    it('no início mostra continue, quiz e anúncio de topo', async () => {
        const { container } = await montar()
        expect(container.querySelector('[data-continue]')).not.toBeNull()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
        expect(container.querySelector('[data-ad="groups_leaderboard"]')).not.toBeNull()
    })

    it.each([
        ['busca', { search: 'x' }],
        ['tipo', { type: 'girl_group' }],
        ['ativos', { active: 'true' }],
        ['letra', { letter: 'A' }],
        ['geração', { generation: '4' }],
        ['ordem', { order: 'az' }],
        ['página 2', { currentPage: 2, totalPages: 3 }],
    ])('com %s some o bloco de início', async (_n, over) => {
        const { container } = await montar({
            ...over,
            emAlta: lista(2, 50),
            geracoes: [{ slug: '4', label: 'Quarta', fotos: [] }],
            debutaram: [{ slug: 'd', nome: 'D', dia: 1, ano: 2020 }],
            mesNome: 'novembro',
            shopProducts: [{} as never],
        })
        expect(container.querySelector('[data-continue]')).toBeNull()
        expect(container.querySelector('[data-quiz]')).toBeNull()
        expect(container.querySelector('[data-shop]')).toBeNull()
        expect(container.querySelector('[data-ad="groups_leaderboard"]')).toBeNull()
        expect(bloco(container, 'lista-em-alta')).toBeNull()
        expect(bloco(container, 'lista-geracoes')).toBeNull()
        expect(bloco(container, 'lista-debut-mes')).toBeNull()
    })

    it('sem slot leaderboard não há anúncio de topo', async () => {
        slots.leaderboard = undefined
        const { container } = await montar()
        expect(container.querySelector('[data-ad="groups_leaderboard"]')).toBeNull()
    })

    it('loja e quiz dependem do recurso e de haver produtos', async () => {
        const { container, unmount } = await montar({ shopProducts: [{} as never] })
        expect(container.querySelector('[data-shop]')).not.toBeNull()
        unmount()
        vi.mocked(temRecurso).mockReturnValue(false)
        const b = await montar({ shopProducts: [{} as never] })
        expect(b.container.querySelector('[data-shop]')).toBeNull()
        expect(b.container.querySelector('[data-quiz]')).toBeNull()
    })

    it('sem produtos não mostra a loja', async () => {
        const { container } = await montar({ shopProducts: [] })
        expect(container.querySelector('[data-shop]')).toBeNull()
    })
})

describe('GroupsPage: em alta, gerações e debuts', () => {
    it('em alta numera a partir de 01, limita a 16 e tira os repetidos da grade', async () => {
        const emAlta = lista(20, 100)
        const groups = [...lista(2, 1), emAlta[0], emAlta[1]]
        const { container } = await montar({ emAlta, groups, total: 4 })
        const sec = bloco(container, 'lista-em-alta')!
        expect(sec.querySelectorAll('li')).toHaveLength(16)
        expect(sec.querySelector('a')!.getAttribute('data-posicao')).toBe('1')
        expect(sec.textContent).toContain('01')
        const todos = hrefs(bloco(container, 'lista-todos'))
        expect(todos).toContain('/groups/grupo-1')
        expect(todos).not.toContain('/groups/grupo-100')
        expect(todos).not.toContain('/groups/grupo-101')
    })

    it('sem em alta não há a seção', async () => {
        const { container } = await montar({ emAlta: [] })
        expect(bloco(container, 'lista-em-alta')).toBeNull()
    })

    it('gerações linkam o filtro, usam rótulo em pt e chave i18n em en', async () => {
        const geracoes = [{ slug: '3', label: 'Terceira geração', fotos: lista(6, 1) }]
        const pt = await montar({ geracoes })
        const secPt = bloco(pt.container, 'lista-geracoes')!
        expect(secPt.textContent).toContain('Terceira geração')
        expect(hrefs(secPt)).toEqual(['/groups?generation=3'])
        expect(secPt.querySelectorAll('img')).toHaveLength(4)
        pt.unmount()
        const en = await montar({ geracoes, locale: 'en' })
        expect(bloco(en.container, 'lista-geracoes')!.textContent).toContain('genLong~{"n":"3"}')
    })

    it('debutaram do mês: até 5, com dia em 2 dígitos e ano', async () => {
        const debutaram = Array.from({ length: 7 }, (_, i) => ({ slug: `d${i}`, nome: `D${i}`, dia: i + 1, ano: 2015 }))
        const { container } = await montar({ debutaram, mesNome: 'novembro' })
        const sec = bloco(container, 'lista-debut-mes')!
        expect(sec.querySelectorAll('li')).toHaveLength(5)
        expect(sec.textContent).toContain('"day":"01"')
        expect(sec.textContent).toContain('"month":"nov"')
        expect(sec.textContent).toContain('"year":2015')
    })

    it('sem mesNome ou sem debuts a seção some', async () => {
        const debutaram = [{ slug: 'd', nome: 'D', dia: 1, ano: 2020 }]
        expect(bloco((await montar({ debutaram })).container, 'lista-debut-mes')).toBeNull()
        cleanup()
        expect(bloco((await montar({ mesNome: 'nov' })).container, 'lista-debut-mes')).toBeNull()
    })
})

describe('GroupsPage: filtros e links', () => {
    it('filtro de tipo preserva busca e zera letra e página', async () => {
        const { container } = await montar({ search: 'ab', letter: 'B', order: 'az', currentPage: 2, totalPages: 4 })
        const links = hrefs(container)
        expect(links).toContain('/groups?search=ab&type=girl_group&order=az')
        expect(links).toContain('/groups?search=ab&order=az')
    })

    it('geração alterna: clicar na ativa remove o filtro', async () => {
        const g = GENERATIONS[0].slug
        const { container } = await montar({ generation: g })
        const chip = (rotulo: string) => Array.from(container.querySelectorAll('a')).find(a => a.textContent === rotulo)!
        expect(chip(GENERATIONS[0].shortLabel).getAttribute('href')).toBe('/groups')
        expect(chip(GENERATIONS[1].shortLabel).getAttribute('href')).toBe(`/groups?generation=${GENERATIONS[1].slug}`)
    })

    it('"só ativos" alterna entre true e remover', async () => {
        const chip = (c: HTMLElement) => Array.from(c.querySelectorAll('a')).find(a => a.textContent === 'onlyActive')!
        const a = await montar()
        expect(chip(a.container).getAttribute('href')).toBe('/groups?active=true')
        a.unmount()
        const b = await montar({ active: 'true' })
        expect(chip(b.container).getAttribute('href')).toBe('/groups')
    })

    it('abas de ordem: popular, A–Z e novos', async () => {
        const { container } = await montar({ type: 'boy_group' })
        const links = hrefs(container)
        expect(links).toContain('/groups?type=boy_group&order=az')
        expect(links).toContain('/groups?type=boy_group&order=novos')
    })

    it('total formatado no título e busca recebe o termo atual', async () => {
        const { container } = await montar({ total: 7, search: 'twice' })
        expect(container.querySelector('h1')!.textContent).toContain('7')
        expect((container.querySelector('[data-search]') as HTMLInputElement).value).toBe('twice')
    })
})

describe('GroupsPage: barra A–Z', () => {
    it('só aparece na ordem az', async () => {
        expect((await montar()).container.querySelector('[data-barra]')).toBeNull()
        cleanup()
        expect((await montar({ order: 'az' })).container.querySelector('[data-barra]')).not.toBeNull()
    })

    it('tem 26 letras; sem contagens nenhuma fica desabilitada', async () => {
        const { container } = await montar({ order: 'az' })
        const letras = container.querySelectorAll('[data-barra] a')
        expect(letras).toHaveLength(26)
        expect(container.querySelectorAll('[data-barra] a[aria-disabled="true"]')).toHaveLength(0)
    })

    it('com contagens, letras vazias viram # desabilitado e a ativa remove o filtro', async () => {
        const { container } = await montar({ order: 'az', letter: 'B', letterCounts: { A: 2, B: 1 } })
        const letras = Array.from(container.querySelectorAll('[data-barra] a'))
        const porLetra = (L: string) => letras.find(a => a.textContent === L)!
        expect(porLetra('C').getAttribute('href')).toBe('#')
        expect(porLetra('C').getAttribute('aria-disabled')).toBe('true')
        expect(porLetra('A').getAttribute('href')).toBe('/groups?letter=A&order=az')
        expect(porLetra('B').getAttribute('href')).toBe('/groups?order=az')
    })
})

describe('GroupsPage: grade, anúncio e paginação', () => {
    it('grade pequena fica num bloco só, sem anúncio', async () => {
        const { container } = await montar({ groups: lista(23), total: 23 })
        expect(container.querySelector('[data-ad="groups_grid"]')).toBeNull()
        expect(bloco(container, 'lista-todos')!.querySelectorAll('.grid')).toHaveLength(1)
    })

    it('com 24 ou mais corta em 12 e põe o anúncio entre os blocos', async () => {
        const { container } = await montar({ groups: lista(30), total: 30 })
        const sec = bloco(container, 'lista-todos')!
        const grades = sec.querySelectorAll('.grid')
        expect(grades).toHaveLength(2)
        expect(grades[0].querySelectorAll('a')).toHaveLength(12)
        expect(grades[1].querySelectorAll('a')).toHaveLength(18)
        expect(sec.querySelectorAll('[data-ad="groups_grid"]')).toHaveLength(1)
    })

    it('sem slot inline não corta a grade', async () => {
        slots.inline = undefined
        const { container } = await montar({ groups: lista(30), total: 30 })
        expect(container.querySelector('[data-ad="groups_grid"]')).toBeNull()
        expect(bloco(container, 'lista-todos')!.querySelectorAll('.grid')).toHaveLength(1)
    })

    it('"ver mais" só existe com próxima página e conta os restantes (48 por página)', async () => {
        const { container } = await montar({ total: 100, totalPages: 3, currentPage: 1 })
        const mais = Array.from(container.querySelectorAll('a')).find(a => a.textContent?.startsWith('seeMore'))!
        expect(mais.getAttribute('href')).toBe('/groups?page=2')
        expect(mais.textContent).toContain('"count":52')
    })

    it('última página não tem "ver mais" e a paginação monta links com os filtros', async () => {
        const { container } = await montar({ total: 100, totalPages: 3, currentPage: 3, type: 'co_ed' })
        expect(Array.from(container.querySelectorAll('a')).some(a => a.textContent?.startsWith('seeMore'))).toBe(false)
        expect(container.querySelector('[data-pagination]')!.getAttribute('data-next')).toBe('/groups?type=co_ed&page=4')
    })

    it('restantes nunca fica negativo', async () => {
        const { container } = await montar({ total: 10, totalPages: 2, currentPage: 1 })
        const mais = Array.from(container.querySelectorAll('a')).find(a => a.textContent?.startsWith('seeMore'))!
        expect(mais.textContent).toContain('"count":0')
    })
})

describe('GroupsPage: estado vazio', () => {
    it.each([
        ['busca', { search: 'zzz' }, 'emptySearch~{"query":"zzz"}'],
        ['letra', { letter: 'Q' }, 'emptyLetter~{"letter":"Q"}'],
        ['nada', {}, 'emptyNone'],
    ])('descrição por %s', async (_n, over, texto) => {
        const { container } = await montar({ groups: [], total: 0, ...over })
        expect(container.querySelector('[data-empty]')!.textContent).toBe(`emptyTitle|${texto}`)
        expect(container.querySelector('.grid')).toBeNull()
    })
})

describe('GroupsPage: cartão da grade (tile)', () => {
    it('mostra contagem de integrantes, fandom válido e meta tipo · ano', async () => {
        const g = grupo(1, { members: [1, 2, 3], fandom_name: 'ONCE', type: 'girl_group', debut_date: '20151020' })
        const { container } = await montar({ groups: [g], total: 1 })
        const tile = bloco(container, 'lista-todos')!.querySelector('.grid a')!
        expect(tile.textContent).toContain('3')
        expect(tile.textContent).toContain('ONCE')
        expect(tile.textContent).toContain('fandom')
        expect(tile.textContent).toContain('girl_group')
        expect(tile.textContent).toContain('2015')
        expect(tile.getAttribute('href')).toBe('/groups/grupo-1')
    })

    it('ignora fandom inválido ("N/A" e texto longo)', async () => {
        const a = await montar({ groups: [grupo(1, { fandom_name: 'N/A' })], total: 1 })
        expect(a.container.textContent).not.toContain('N/A')
        a.unmount()
        const b = await montar({ groups: [grupo(2, { fandom_name: 'x'.repeat(40) })], total: 1 })
        expect(b.container.textContent).not.toContain('xxxxx')
    })

    it('encerrado ganha selo; sem imagem usa gradiente com ícone', async () => {
        const g = grupo(1, { active: false }, { featured_image_url: undefined })
        const { container } = await montar({ groups: [g], total: 1 })
        const tile = bloco(container, 'lista-todos')!
        expect(tile.textContent).toContain('ended')
        expect(tile.querySelector('img')).toBeNull()
        expect(tile.querySelector('svg')).not.toBeNull()
    })

    it('rostos do hover: até 4 integrantes por grupo', async () => {
        const rostos = Array.from({ length: 6 }, (_, i) => ({ nome: `M${i}`, foto: `https://img.test/m${i}.jpg` }))
        const { container } = await montar({ groups: [grupo(1)], total: 1, integrantes: { 1: rostos } })
        const imgs = Array.from(bloco(container, 'lista-todos')!.querySelectorAll('img'))
        expect(imgs.filter(i => i.getAttribute('src')!.includes('/m'))).toHaveLength(4)
    })
})

describe('GroupsPage: JSON-LD', () => {
    const ld = (c: HTMLElement) => JSON.parse(c.querySelector('[data-jsonld]')!.textContent!)

    it('idioma padrão: url sem prefixo', async () => {
        const { container } = await montar()
        const d = ld(container)
        expect(d['@type']).toBe('CollectionPage')
        expect(d.url).toBe(`${SITE_URL}/groups`)
        expect(d.name).toContain('schemaName')
    })

    it('outro idioma: url com prefixo e inLanguage', async () => {
        const { container } = await montar({ locale: 'en' })
        const d = ld(container)
        expect(d.url).toBe(`${SITE_URL}/en/groups`)
        expect(d.inLanguage).toBeTruthy()
    })
})

describe('GroupCard', () => {
    const render1 = (g: WPGroup, locale?: 'pt' | 'en') => render(<GroupCard group={g} locale={locale} />)

    it('mostra nome, tipo traduzido, ano, geração e contagem', () => {
        const g = grupo(1, { type: 'boy_group', debut_date: '20130612', members: [1, 2], name_hangul: '방탄' })
        const { container } = render1(g)
        expect(container.querySelector('a')!.getAttribute('href')).toBe('/groups/grupo-1')
        expect(container.textContent).toContain('Grupo 1')
        expect(container.textContent).toContain('Boy Group · 2013')
        expect(container.textContent).toContain('2 integrantes')
        expect(container.textContent).toContain('방탄')
    })

    it('singular para 1 integrante', () => {
        const { container } = render1(grupo(1, { members: [1] }))
        expect(container.textContent).toContain('1 integrante')
        expect(container.textContent).not.toContain('1 integrantes')
    })

    it('encerrado tem selo e não tem "em alta"; textos mudam por idioma', () => {
        const pt = render1(grupo(1, { active: false, noticias_14d: 999 }))
        expect(pt.container.textContent).toContain('encerrado')
        expect(pt.container.textContent).not.toContain('em alta')
        pt.unmount()
        const en = render1(grupo(2, { active: false }), 'en')
        expect(en.container.textContent).toContain('ended')
    })

    it('sem imagem e com cor: inicial do nome colorida', () => {
        const { container } = render1(grupo(1, { color: '#ff0066' }, { featured_image_url: undefined }))
        expect(container.querySelector('img')).toBeNull()
        expect(container.textContent).toContain('G')
    })

    it('sem tipo, ano ou integrantes não quebra', () => {
        const { container } = render1(grupo(1))
        expect(container.querySelector('a')).not.toBeNull()
    })
})

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { CalendarEvent } from '@/lib/calendario/tipos'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { getVitrineGeral } from '@/lib/wordpress/vitrine'
import { temRecurso } from '@/lib/i18n/recursos'
import CalendarioPage, { generateMetadata } from './CalendarioIndex'

const captura = vi.hoisted(() => ({ events: [] as unknown[], todayStr: '' }))
const eventos = () => captura.events as CalendarEvent[]

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))
vi.mock('@/lib/i18n/recursos', () => ({ temRecurso: vi.fn(() => true) }))
vi.mock('@/lib/i18n/routes', () => ({
    href: (rota: string, params: { slug?: string } | undefined, locale: string) => `/${locale}/${rota}${params?.slug ? `/${params.slug}` : ''}`,
}))
vi.mock('@/lib/i18n/alternates', () => ({ buildAlternatesAtivos: (r: string, _: unknown, l: string) => ({ canonical: `${r}:${l}` }) }))
vi.mock('@/lib/constants/site', () => ({
    compartilhamento: (o: { titulo: string; descricao: string; caminho: string }) => ({ share: o }),
}))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: vi.fn() }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: vi.fn() }))
vi.mock('@/lib/wordpress/vitrine', () => ({ getVitrineGeral: vi.fn() }))
vi.mock('@/components/features/CalendarPage', () => ({
    CalendarPage: (p: { events: unknown[]; todayStr: string }) => {
        captura.events = p.events
        captura.todayStr = p.todayStr
        return <div data-calendario />
    },
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => <nav data-breadcrumb /> }))
vi.mock('@/components/ui/LojaEmLinha', () => ({
    LojaEmLinha: (p: { products: { id: number }[]; bloco: string }) => <div data-loja={p.bloco} data-ids={p.products.map(x => x.id).join(',')} />,
}))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: (p: { category: string }) => <div data-quiz={p.category} /> as ReactNode }))

type Obj = Record<string, unknown>
const artista = (id: number, nome: string, birth?: string, acf: Obj = {}) => ({
    id, slug: nome.toLowerCase(), title: { rendered: nome }, featured_image_url: `https://img.test/${id}.jpg`, acf: { birth_date: birth, ...acf },
})
const grupo = (id: number, nome: string, debut?: string) => ({
    id, slug: nome.toLowerCase(), title: { rendered: nome }, featured_image_url: `https://img.test/g${id}.jpg`, acf: { debut_date: debut },
})

function configurar(porMes: Record<number, unknown[]> = {}, grupos1: unknown[] = [], grupos2: unknown[] = []) {
    vi.mocked(getArtists).mockImplementation((async (p: { birthMonth: number }) => ({ items: porMes[p.birthMonth] ?? [] })) as never)
    vi.mocked(getGroups).mockImplementation((async (p: { page: number }) => ({ items: p.page === 1 ? grupos1 : grupos2 })) as never)
}
async function montar(locale?: 'en') {
    return render(await CalendarioPage({ locale }))
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 27, 15, 30))
    captura.events = []
    configurar()
    vi.mocked(getVitrineGeral).mockResolvedValue([{ id: 1 }, { id: 2 }] as never)
    vi.mocked(temRecurso).mockReturnValue(true)
})
afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
})

describe('generateMetadata', () => {
    it('título, descrição, alternates e compartilhamento do idioma', async () => {
        const m = await generateMetadata({ locale: 'en' }) as Obj
        expect(m.title).toBe('metaTitulo')
        expect(m.description).toBe('metaDescricao')
        expect(m.alternates).toEqual({ canonical: 'calendar:en' })
        expect(m.share).toEqual({ titulo: 'metaTitulo', descricao: 'metaDescricaoCurta', caminho: '/en/calendar' })
    })

    it('sem argumento usa o idioma padrão', async () => {
        const m = await generateMetadata() as Obj
        expect(m.alternates).toEqual({ canonical: 'calendar:pt' })
    })
})

describe('CalendarioPage: busca', () => {
    it('pede aniversariantes do mês atual e dos dois seguintes, virando o ano', async () => {
        await montar()
        const meses = vi.mocked(getArtists).mock.calls.map(c => (c[0] as { birthMonth: number }).birthMonth)
        expect(meses).toEqual([11, 12, 1])
        expect(vi.mocked(getArtists).mock.calls[0][0]).toMatchObject({ perPage: 100, orderby: 'date', order: 'desc' })
    })

    it('junta as duas páginas de grupos', async () => {
        configurar({}, [grupo(1, 'Alfa', '20201201')], [grupo(2, 'Beta', '20191202')])
        await montar()
        expect(eventos().map(e => e.name)).toEqual(['Alfa', 'Beta'])
        expect(vi.mocked(getGroups).mock.calls.map(c => (c[0] as { page: number }).page)).toEqual([1, 2])
    })

    it('passa a data de hoje ao calendário', async () => {
        await montar()
        expect(captura.todayStr).toBe('2026-11-27')
    })

    it('num servidor em UTC, às 23h de Brasília ainda é o mesmo dia', async () => {
        vi.stubEnv('TZ', 'UTC')
        vi.setSystemTime(new Date('2026-12-01T02:00:00Z'))
        configurar({ 11: [artista(1, 'Ana', '1995-11-30')] })
        await montar()
        expect(captura.todayStr).toBe('2026-11-30')
        expect(eventos().map(e => [e.name, e.daysUntil])).toEqual([['Ana', 0]])
        expect(vi.mocked(getArtists).mock.calls.map(c => (c[0] as { birthMonth: number }).birthMonth)).toEqual([11, 12, 1])
        vi.unstubAllEnvs()
    })
})

describe('CalendarioPage: aniversários', () => {
    it('próximo aniversário neste ano: dias, idade, data e link', async () => {
        configurar({ 12: [artista(1, 'Ana', '1995-12-01')] })
        await montar()
        expect(eventos()).toHaveLength(1)
        expect(eventos()[0]).toMatchObject({
            id: 1, type: 'birthday', name: 'Ana', slug: 'ana', day: 1, month: 12, year: 2026,
            date: '2026-12-01', daysUntil: 4, extra: 'idade~{"n":31}', href: '/pt/artist/ana', image: { src: 'https://img.test/1.jpg', alt: '' },
        })
    })

    it('aceita data ACF no formato AAAAMMDD', async () => {
        configurar({ 12: [artista(1, 'Ana', '19951201')] })
        await montar()
        expect(eventos()[0].date).toBe('2026-12-01')
    })

    it('aniversário hoje entra com 0 dias; ontem só no ano que vem e fica fora da janela', async () => {
        configurar({ 11: [artista(1, 'Hoje', '2000-11-27'), artista(2, 'Ontem', '2000-11-26')] })
        await montar()
        expect(eventos().map(e => [e.name, e.daysUntil])).toEqual([['Hoje', 0]])
    })

    it('mês que virou o ano vai para o ano seguinte, com a idade certa', async () => {
        configurar({ 1: [artista(1, 'Jan', '1990-01-15')] })
        await montar()
        expect(eventos()[0]).toMatchObject({ year: 2027, date: '2027-01-15', daysUntil: 49, extra: 'idade~{"n":37}' })
    })

    it('mais de 90 dias fica de fora', async () => {
        configurar({ 1: [artista(1, 'Longe', '1990-02-26')] })
        await montar()
        expect(eventos()).toEqual([])
    })

    it('falecido, sem data e repetido entre meses não geram duplicata', async () => {
        const ana = artista(1, 'Ana', '1995-12-01')
        configurar({
            11: [artista(2, 'Falecido', '1980-11-30', { death_date: '2020-01-01' }), artista(3, 'SemData')],
            12: [ana], 1: [ana],
        })
        await montar()
        expect(eventos().map(e => e.name)).toEqual(['Ana'])
    })
})

describe('CalendarioPage: debuts', () => {
    it('aniversário de estreia com anos completos', async () => {
        configurar({}, [grupo(1, 'Alfa', '2016-12-05')])
        await montar()
        expect(eventos()[0]).toMatchObject({ type: 'debut', name: 'Alfa', date: '2026-12-05', daysUntil: 8, extra: 'anosDebut~{"n":10}', href: '/pt/group/alfa' })
    })

    it('estreia no próprio ano vira "estreia"', async () => {
        configurar({}, [grupo(1, 'Novo', '2026-12-05')])
        await montar()
        expect(eventos()[0].extra).toBe('estreia')
    })

    it('sem data ou além de 90 dias não entram', async () => {
        configurar({}, [grupo(1, 'SemData'), grupo(2, 'Longe', '2015-06-10')])
        await montar()
        expect(eventos()).toEqual([])
    })
})

describe('CalendarioPage: ordem', () => {
    it('por dias restantes e, no empate, por nome', async () => {
        configurar(
            { 12: [artista(1, 'Zoe', '1995-12-01'), artista(2, 'Ana', '1990-12-01'), artista(3, 'Bia', '1990-11-30')] },
            [grupo(4, 'Meio', '2020-12-03')],
        )
        await montar()
        expect(eventos().map(e => e.name)).toEqual(['Bia', 'Ana', 'Zoe', 'Meio'])
        expect(eventos().map(e => e.daysUntil)).toEqual([3, 4, 4, 6])
    })

    it('data inválida não gera evento nem derruba a página', async () => {
        configurar({ 12: [artista(1, 'Ruim', 'não é data'), artista(2, 'Ana', '1995-12-01')] }, [grupo(3, 'Torto', 'xx')])
        await montar()
        expect(eventos().map(e => e.name)).toEqual(['Ana'])
    })
})

describe('CalendarioPage: rodapé', () => {
    it('em português: loja de presentes, quiz e breadcrumb', async () => {
        const { container } = await montar()
        expect(getVitrineGeral).toHaveBeenCalledWith('calendario', 6, 'kpop')
        expect(container.querySelector('[data-loja="calendario-loja"]')!.getAttribute('data-ids')).toBe('1,2')
        expect(container.querySelector('[data-quiz]')!.getAttribute('data-quiz')).toBe('k-pop')
        expect(container.querySelector('[data-breadcrumb]')).not.toBeNull()
    })

    it('em inglês não busca a vitrine; sem recurso de loja o bloco some', async () => {
        vi.mocked(temRecurso).mockReturnValue(false)
        const { container } = await montar('en')
        expect(getVitrineGeral).not.toHaveBeenCalled()
        expect(container.querySelector('[data-loja]')).toBeNull()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
    })
})

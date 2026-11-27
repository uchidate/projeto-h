// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

// Cobre o que a agenda de aniversários decide: mês da URL (e o que vale quando é inválido), quem entra
// (sem data, data ruim ou falecido ficam de fora), agrupamento por dia, "hoje", idade, anúncio a cada 6 dias,
// loja e quiz só onde o recurso existe, e que o dia do aniversário não muda com o fuso do servidor.
const m = vi.hoisted(() => ({
    recursos: { loja: true, quiz: true } as Record<string, boolean>,
    getArtists: vi.fn(),
    vitrine: vi.fn(),
    ads: { slots: { inline: 'in' as string | undefined } },
}))

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/i18n/recursos', () => ({ temRecurso: (r: string) => m.recursos[r] }))
vi.mock('@/lib/i18n/metadata-pagina', () => ({ metadataDaRota: (o: unknown) => o }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: m.ads }))
vi.mock('next/image', () => ({ default: (p: { src: string; alt: string }) => <span data-img data-src={p.src} data-alt={p.alt} /> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, className: _c }: { href: string; children: React.ReactNode; className?: string }) => <a href={href}>{children}</a>,
}))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: m.getArtists }))
vi.mock('@/lib/wordpress/vitrine', () => ({ getVitrineGeral: m.vitrine }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: unknown }) => <script data-jsonld>{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => <nav data-crumb /> }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: (p: { analyticsPlacement: string }) => <div data-anuncio={p.analyticsPlacement} /> }))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: (p: { products: unknown[] }) => <div data-loja data-n={p.products.length} /> }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))

import BirthdaysPage, { metadataDaPagina } from './BirthdaysIndex'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)
const TZ_ORIGINAL = process.env.TZ

type Artista = Record<string, unknown>
let seq = 0
const artista = (nascimento: string | undefined, extra: Artista = {}): Artista => ({
    id: ++seq, slug: `a-${seq}`, title: { rendered: `Artista ${seq}` }, featured_image_url: null,
    acf: { birth_date: nascimento, ...(extra.acf as object) }, ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'acf')),
})

const montar = async (month?: string, locale?: typeof DEFAULT_LOCALE) =>
    render(await BirthdaysPage({ searchParams: Promise.resolve({ month }), locale }))
const dias = (c: Element) => [...c.querySelectorAll('.tabular-nums')].map((n) => n.textContent)
const cartoes = (c: Element) => [...c.querySelectorAll('a[href^="/artists/a-"]')].map((a) => a.getAttribute('href'))

beforeEach(() => {
    seq = 0
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
    m.recursos.loja = true
    m.recursos.quiz = true
    m.ads.slots.inline = 'in'
    m.getArtists.mockResolvedValue({ items: [] })
    m.vitrine.mockResolvedValue([{ id: 1 }, { id: 2 }])
})
afterEach(() => {
    cleanup()
    vi.useRealTimers()
    if (TZ_ORIGINAL === undefined) delete process.env.TZ
    else process.env.TZ = TZ_ORIGINAL
})

describe('BirthdaysIndex — mês', () => {
    it('sem ?month usa o mês de hoje e busca só esse mês', async () => {
        await montar()
        expect(m.getArtists).toHaveBeenCalledWith(expect.objectContaining({ birthMonth: 11, perPage: 100 }))
    })

    it.each([['3', 3], ['12', 12], ['0', 11], ['abc', 11], ['99', 12], ['-4', 1]])('?month=%s vira o mês %i', async (valor, esperado) => {
        await montar(valor)
        expect(m.getArtists).toHaveBeenCalledWith(expect.objectContaining({ birthMonth: esperado }))
    })

    it('o cabeçalho mostra o mês e o ano', async () => {
        const { container } = await montar('3')
        expect(container.querySelector('h1')?.textContent).toMatch(/mar/i)
        expect(container.textContent).toContain('2026')
    })

    it('as abas têm os 12 meses, o mês real aponta para a raiz e o ativo é destacado', async () => {
        const { container } = await montar('3')
        const abas = [...container.querySelectorAll('a[href^="/artists/birthdays"]')]
        expect(abas).toHaveLength(12)
        expect(abas[10].getAttribute('href')).toBe('/artists/birthdays')
        expect(abas[2].getAttribute('href')).toBe('/artists/birthdays?month=3')
    })

    it('os metadados usam o mês pedido, e o de hoje quando inválido', async () => {
        const p = await metadataDaPagina({ searchParams: Promise.resolve({ month: '7' }) }) as unknown as { titulo: string; robots: unknown; rota: string }
        expect(p.titulo).toMatch(/^title~\{"month":"Julho"\}$/)
        expect(p.rota).toBe('birthdays')
        expect(p.robots).toEqual({ index: true, follow: true })
        const hoje = await metadataDaPagina({ searchParams: Promise.resolve({ month: 'x' }) }) as unknown as { titulo: string }
        expect(hoje.titulo).toBe('title~{"month":"Novembro"}')
    })
})

describe('BirthdaysIndex — quem entra', () => {
    it('ignora sem data, falecido e data impossível de ler', async () => {
        m.getArtists.mockResolvedValue({
            items: [
                artista('1999-11-10'),
                artista(undefined),
                artista('1999-11-11', { acf: { death_date: '2020-01-01' } }),
                artista('1999-11-12', { acf: {} }),
            ],
        })
        const { container } = await montar()
        expect(cartoes(container)).toEqual(['/artists/a-1', '/artists/a-4'])
    })

    it('aceita data em YYYYMMDD', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('19991110')] })
        const { container } = await montar()
        expect(dias(container)).toEqual(['10'])
    })

    it('ordena por dia e agrupa quem faz no mesmo dia', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('1999-11-20'), artista('1998-11-03'), artista('2000-11-20')] })
        const { container } = await montar()
        expect(dias(container)).toEqual(['3', '20'])
        expect(cartoes(container)).toEqual(['/artists/a-2', '/artists/a-1', '/artists/a-3'])
    })

    it('a contagem do cabeçalho só conta quem entrou', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('1999-11-20'), artista(undefined)] })
        const { container } = await montar()
        expect(container.textContent).toContain('count~{"count":1,"month":"Novembro"}')
    })

    it('mostra idade quando o ano é crível e omite quando é placeholder', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('2000-11-10'), artista('1900-11-11')] })
        const { container } = await montar()
        expect(container.textContent).toContain('age~{"age":26}')
        expect(container.textContent?.match(/age~/g)).toHaveLength(1)
    })

    it('mostra o hangul quando existe e a inicial quando não há foto', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('2000-11-10', { acf: { name_hangul: '아이유' } })] })
        const { container } = await montar()
        expect(container.textContent).toContain('아이유')
        expect(container.textContent).toContain('A')
        expect(container.querySelector('[data-img]')).toBeNull()
    })

    it('com foto, usa o alt da imagem ou, se faltar, o nome', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('2000-11-10', { featured_image_url: 'https://x/f.jpg' })] })
        const { container } = await montar()
        expect(container.querySelector('[data-img]')?.getAttribute('data-alt')).toBe('Artista 1')
    })
})

describe('BirthdaysIndex — hoje', () => {
    it('marca "hoje" só no dia de hoje do mês de hoje', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('1999-11-15'), artista('1999-11-20')] })
        const { container } = await montar()
        expect(container.textContent?.match(/today/g)).toHaveLength(1)
    })

    it('em outro mês, nenhum dia é "hoje" mesmo com o mesmo número de dia', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('1999-03-15')] })
        const { container } = await montar('3')
        expect(container.textContent).not.toContain('today')
    })
})

describe('BirthdaysIndex — lista vazia, loja, quiz e anúncios', () => {
    it('sem aniversariantes mostra a mensagem do mês e nem a faixa da loja', async () => {
        const { container } = await montar()
        expect(container.textContent).toContain('emptyDesc~{"month":"Novembro"}')
        expect(container.querySelector('[data-loja]')).toBeNull()
    })

    it('com aniversariantes mostra a loja antes da lista e busca a vitrine de aniversários', async () => {
        m.getArtists.mockResolvedValue({ items: [artista('1999-11-20')] })
        const { container } = await montar()
        expect(container.querySelector('[data-loja]')?.getAttribute('data-n')).toBe('2')
        expect(m.vitrine).toHaveBeenCalledWith('aniversarios', 6, 'kpop')
    })

    it('sem o recurso de loja, nem busca a vitrine; sem o de quiz, não mostra o quiz', async () => {
        m.recursos.loja = false
        m.recursos.quiz = false
        m.getArtists.mockResolvedValue({ items: [artista('1999-11-20')] })
        const { container } = await montar()
        expect(m.vitrine).not.toHaveBeenCalled()
        expect(container.querySelector('[data-loja]')).toBeNull()
        expect(container.querySelector('[data-quiz]')).toBeNull()
    })

    it('com o recurso de quiz, mostra o quiz', async () => {
        const { container } = await montar()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
    })

    it('anúncio a cada 6 dias, nunca antes do primeiro', async () => {
        const items = Array.from({ length: 13 }, (_, i) => artista(`1999-11-${String(i + 1).padStart(2, '0')}`))
        m.getArtists.mockResolvedValue({ items })
        const { container } = await montar()
        // 13 dias: índices 6 e 12 recebem anúncio antes
        expect(container.querySelectorAll('[data-anuncio="aniversariantes"]')).toHaveLength(2)
    })

    it('sem slot de anúncio não há anúncio', async () => {
        m.ads.slots.inline = undefined
        const items = Array.from({ length: 8 }, (_, i) => artista(`1999-11-${String(i + 1).padStart(2, '0')}`))
        m.getArtists.mockResolvedValue({ items })
        const { container } = await montar()
        expect(container.querySelector('[data-anuncio]')).toBeNull()
    })

    it('o JSON-LD aponta para a rota de aniversários', async () => {
        const { container } = await montar()
        const ld = JSON.parse(container.querySelector('[data-jsonld]')!.textContent!)
        expect(ld['@type']).toBe('CollectionPage')
        expect(ld.url).toMatch(/\/artists\/birthdays$/)
    })
})

describe('BirthdaysIndex — fuso do servidor', () => {
    it.each(['UTC', 'America/Sao_Paulo', 'Asia/Seoul', 'Pacific/Kiritimati'])('o dia 1 e o dia 31 não mudam em %s', async (tz) => {
        process.env.TZ = tz
        m.getArtists.mockResolvedValue({ items: [artista('1999-03-01'), artista('1999-03-31')] })
        const { container } = await montar('3')
        expect(dias(container)).toEqual(['1', '31'])
    })

    it.each(['UTC', 'Asia/Seoul'])('1º de janeiro mantém a idade do ano certo em %s', async (tz) => {
        process.env.TZ = tz
        m.getArtists.mockResolvedValue({ items: [artista('2000-01-01')] })
        const { container } = await montar('1')
        expect(container.textContent).toContain('age~{"age":26}')
    })
})

describe.skipIf(!OUTRO)('BirthdaysIndex — outro idioma', () => {
    it('os nomes dos meses vêm no idioma da página', async () => {
        const { container } = await montar('3', OUTRO as never)
        const nome = container.querySelector('h1')!.textContent!
        const pt = await metadataDaPagina({ searchParams: Promise.resolve({ month: '3' }), locale: DEFAULT_LOCALE }) as unknown as { titulo: string }
        expect(pt.titulo).toContain('Março')
        expect(nome).not.toBe('Março')
    })

    it('sem loja nem quiz fora do português', async () => {
        m.recursos.loja = false
        m.recursos.quiz = false
        const { container } = await montar(undefined, OUTRO as never)
        expect(container.querySelector('[data-loja]')).toBeNull()
        expect(container.querySelector('[data-quiz]')).toBeNull()
    })
})

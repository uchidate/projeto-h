// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { Fandom } from '@/lib/wordpress/fandoms'
import type { WPArtist } from '@/lib/wordpress/types'

const m = vi.hoisted(() => ({ datas: vi.fn(), posts: vi.fn(), faq: vi.fn() }))

vi.mock('@/components/fandoms/EspacoDoFa', () => ({ BotaoTorcida: ({ grupoId }: { grupoId: number | null }) => <button>{`torcer ${grupoId}`}</button> }))
vi.mock('@/lib/fandoms/datas', () => ({ proximasDatas: m.datas }))
vi.mock('@/lib/quiz/dia', () => ({ chaveDia: () => '2026-11-27' }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.posts }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => null }))
vi.mock('@/components/ui/QuizFacts', () => ({ QuizFacts: () => null }))
vi.mock('@/components/fandoms/FandomGroupCard', () => ({ FandomGroupCard: () => <div data-testid="grupo" /> }))
vi.mock('@/components/fandoms/FandomSidebarFicha', () => ({ FandomSidebarFicha: () => null }))
vi.mock('@/components/fandoms/EnriquecerTorcida', () => ({ NomeDaTorcida: () => null }))
vi.mock('@/components/fandoms/OutrasTorcidas', () => ({ OutrasTorcidas: () => null }))
vi.mock('@/components/seo/EntityFAQ', () => ({
    EntityFAQ: ({ items }: { items: { question: string; answer: string }[] }) => { m.faq(items); return null },
}))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: () => null }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { FandomDetailPage } from './FandomDetailPage'

const grupo = (id: number, acf: Record<string, unknown> = {}) => ({ id, slug: `g${id}`, title: { rendered: `Grupo ${id}` }, acf })
const fandom = (extra: Record<string, unknown> = {}) =>
    ({ slug: 'my', name: 'MY', color: '#112233', lightstick: 'Bastão', groups: [grupo(1, { debut_date: '2020-11-17', curiosidades: ['O nome MY vem de um amigo.'] })], ...extra }) as unknown as Fandom
const artista = { id: 9, slug: 'karina', title: { rendered: 'Karina' }, featured_image_url: 'https://exemplo.test/k.jpg', acf: {} } as unknown as WPArtist

/** A seção de novidades é um componente assíncrono: sai da árvore aqui e é testada à parte. */
const assincronos: ReactElement[] = []
function semAssincronos(no: ReactNode): ReactNode {
    if (!isValidElement<{ children?: ReactNode }>(no)) return no
    if (typeof no.type === 'function' && no.type.constructor.name === 'AsyncFunction') { assincronos.push(no); return null }
    if (no.props.children === undefined) return no
    return cloneElement(no, undefined, ...(Children.map(no.props.children, semAssincronos) ?? []))
}
const montar = (f: Fandom, artists: WPArtist[] = []) => render(semAssincronos(FandomDetailPage({ fandom: f, artists, outras: [] })) as ReactElement)
const novidades = async () => {
    const el = assincronos[0] as ReactElement<Record<string, unknown>>
    return (el.type as unknown as (p: Record<string, unknown>) => Promise<ReactElement | null>)(el.props)
}

beforeEach(() => {
    assincronos.length = 0
    m.datas.mockReset().mockReturnValue([])
    m.posts.mockReset()
    m.faq.mockReset()
})
afterEach(cleanup)

describe('FandomDetailPage', () => {
    it('monta cabeçalho, grupo, artistas e as quatro perguntas', () => {
        montar(fandom(), [artista])
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fandom MY: a torcida do grupo Grupo 1')
        expect(screen.getByText('1 grupo')).toBeTruthy()
        expect(screen.getByText('1 artistas')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'torcer 1' })).toBeTruthy()
        expect(screen.getByText('O grupo da torcida')).toBeTruthy()
        expect(screen.getByRole('img', { name: 'Foto de Karina, artista da torcida MY' })).toBeTruthy()
        expect(screen.getByRole('link', { name: /Karina/ }).getAttribute('href')).toBe('/artists/karina')
        const perguntas = m.faq.mock.calls[0][0]
        expect(perguntas).toHaveLength(4)
        expect(perguntas[1].answer).toBe('O nome MY vem de um amigo.')
        expect(perguntas[2].answer).toBe('A torcida acompanha Grupo 1, que estreou em 2020.')
    })

    it('com vários grupos usa o plural e a estreia mais antiga; sem dados corta perguntas', () => {
        montar(fandom({ color: null, lightstick: null, groups: [grupo(1, { debut_date: '2021-01-01' }), grupo(2, { debut_date: '2018-01-01' })] }))
        expect(screen.getByText('Os 2 grupos da torcida')).toBeTruthy()
        expect(screen.getAllByTestId('grupo')).toHaveLength(2)
        expect(screen.queryByText('Quem a torcida ama')).toBeNull()
        const perguntas = m.faq.mock.calls[0][0]
        expect(perguntas).toHaveLength(2)
        expect(perguntas[1].answer).toContain('estreou em 2018 (o primeiro dos 2 grupos da torcida)')
    })

    it('mostra as próximas datas com o prazo por extenso', () => {
        m.datas.mockReturnValue([
            { tipo: 'estreia', quem: 'Grupo 1', anos: 1, dia: '17/11', dias: 0 },
            { tipo: 'aniversario', quem: 'Karina', anos: 27, dia: '28/11', dias: 1 },
            { tipo: 'estreia', quem: 'Grupo 2', anos: 3, dia: '05/12', dias: 8 },
        ])
        montar(fandom())
        expect(screen.getByText('hoje')).toBeTruthy()
        expect(screen.getByText('amanhã')).toBeTruthy()
        expect(screen.getByText('em 8 d')).toBeTruthy()
        expect(screen.getByText('Grupo 1 completa 1 ano de estreia')).toBeTruthy()
        expect(screen.getByText('Karina faz 27 anos')).toBeTruthy()
        expect(screen.getByText('Grupo 2 completa 3 anos de estreia')).toBeTruthy()
    })

    it('novidades: junta até três grupos, tira repetidos e fica com as três mais recentes', async () => {
        const post = (id: number) => ({ id, slug: `p${id}`, date: `2026-11-0${id}`, title: { rendered: `Post ${id}` }, featured_image_url: id === 4 ? 'https://exemplo.test/p.jpg' : undefined })
        m.posts.mockImplementation(async ({ mentionsSlug }: { mentionsSlug: string }) => {
            if (mentionsSlug === 'g3') throw new Error('fora')
            return { items: mentionsSlug === 'g1' ? [post(1), post(4)] : [post(4), post(3), post(2)] }
        })
        montar(fandom({ groups: [grupo(1), grupo(2), grupo(3), grupo(4)] }))
        render(await novidades() as ReactElement)
        expect(m.posts).toHaveBeenCalledTimes(3)
        const links = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('/blog/'))
        expect(links.map(a => a.getAttribute('href'))).toEqual(['/blog/p4', '/blog/p3', '/blog/p2'])
        expect(screen.getByRole('img', { name: 'Post 4' })).toBeTruthy()
    })

    it('novidades somem sem artigo', async () => {
        m.posts.mockResolvedValue({ items: [] })
        montar(fandom())
        expect(await novidades()).toBeNull()
    })
})

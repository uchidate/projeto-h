import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidElement, type ReactElement, type ReactNode } from 'react'

// A home é conferida pela árvore devolvida: quais blocos entram, em que idioma, e com quais matérias.
const m = vi.hoisted(() => ({ capas: vi.fn(), editorias: vi.fn() }))

vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { leaderboard: '1', inline: '2' } } }))
vi.mock('@/lib/home/frescor', () => ({ escolherCapas: m.capas }))
vi.mock('@/lib/home/editorias', () => ({ montarEditorias: m.editorias }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: function Anuncio() { return null } }))
vi.mock('@/components/home/HomeQuizBanner', () => ({ HomeQuizBanner: function Quiz() { return null } }))
vi.mock('@/components/home/HomeCapitulo', () => ({ HomeCapitulo: function Capitulo() { return null } }))
vi.mock('@/components/home/AbasCelular', () => ({ AbasCelular: function Abas() { return null } }))
vi.mock('@/components/home/HomeHero', () => ({ HomeHero: function Hero() { return null } }))
vi.mock('@/components/home/HomeLoja', () => ({ HomeLoja: function Loja() { return null } }))
vi.mock('@/components/home/HomeExplore', () => ({ HomeExplore: function Explore() { return null } }))
vi.mock('@/components/home/HomeTema', () => ({ HomeTema: function Tema() { return null } }))
vi.mock('@/components/home/HomeGuias', () => ({ HomeGuias: function Guias() { return null } }))
vi.mock('@/components/home/HomeAssuntos', () => ({ HomeAssuntos: function Assuntos() { return null } }))
vi.mock('@/components/home/HomeCalendario', () => ({ HomeCalendario: function Calendario() { return null } }))
vi.mock('@/components/home/HomeEstaSemana', () => ({ HomeEstaSemana: function Semana() { return null } }))
vi.mock('@/components/home/HomeSeguindo', () => ({ HomeSeguindo: function Seguindo() { return null } }))
vi.mock('@/components/home/HomeEditorias', () => ({ HomeEditorias: function Editorias() { return null } }))
vi.mock('@/components/home/HomeDestaquesColuna', () => ({ HomeDestaquesColuna: function Destaques() { return null } }))
vi.mock('@/components/home/HomeLongreads', () => ({ HomeLongreads: function Longreads() { return null } }))
vi.mock('@/components/home/HomePopulares', () => ({ HomePopulares: function Populares() { return null } }))

import { HomeFrontPage } from './HomeFrontPage'

type Props = Parameters<typeof HomeFrontPage>[0]
type No = ReactElement<Record<string, unknown> & { children?: ReactNode }>

function elementos(no: ReactNode): No[] {
    if (Array.isArray(no)) return no.flatMap(elementos)
    if (!isValidElement(no)) return []
    const el = no as No
    return [el, ...elementos(el.props.children)]
}
const montar = async (extra: Record<string, unknown> = {}) => {
    const raiz = await HomeFrontPage({ posts: [], productions: [], artists: [], homeSettings: { hubs: [], highlightPostIds: [] }, streamingByPlatform: {}, ...extra } as unknown as Props)
    const todos = elementos(raiz)
    const de = (nome: string) => todos.filter(e => typeof e.type === 'function' && e.type.name === nome)
    return { de, capitulos: de('Capitulo').map(c => `${c.props.n}:${c.props.chave}`) }
}
const posts = Array.from({ length: 14 }, (_, i) => ({ id: i + 1 }))
const ids = (lista: unknown) => (lista as { id: number }[]).map(p => p.id)
const tema = (n: number) => ({ artigos: Array(n).fill({}), pratos: [], marcas: [] })

beforeEach(() => {
    m.capas.mockReset().mockImplementation((p: unknown[]) => p.slice(0, 2))
    m.editorias.mockReset().mockReturnValue([])
})

describe('HomeFrontPage em português', () => {
    it('numera todos os capítulos em sequência, mesmo sem matérias', async () => {
        const { capitulos, de } = await montar()
        expect(capitulos).toEqual(['1:agora', '2:editoria', '3:aprenda', '4:reportagem', '5:dados', '6:jogue', '7:temas', '8:loja'])
        expect(de('Loja')).toHaveLength(1)
        expect(de('Anuncio')).toHaveLength(2)
        expect(de('Assuntos')).toHaveLength(0)
        expect(de('Abas')).toHaveLength(0)
    })

    it('não repete matéria entre capa, destaques, longreads e editorias', async () => {
        const { de } = await montar({ posts })
        expect(ids(de('Hero')[0].props.posts)).toEqual([1, 2])
        expect(ids(de('Destaques')[0].props.posts)).toEqual([3, 4, 5, 6, 7])
        expect(ids(de('Longreads')[0].props.posts)).toEqual([9, 10, 11, 12])
        expect(m.editorias.mock.calls[0][1]).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))
    })

    it('respeita os destaques escolhidos à mão, sem os que já estão na capa', async () => {
        const { de } = await montar({ posts, homeSettings: { hubs: [{ label: 'Hub' }], highlightPostIds: [10, 1, 99, 4] } })
        expect(ids(de('Destaques')[0].props.posts)).toEqual([10, 4])
        expect(de('Assuntos')[0].props.hubs).toEqual([{ label: 'Hub' }])
    })

    it('sem matéria fresca a capa vira a primeira produção com imagem', async () => {
        m.capas.mockReturnValue([])
        const { de } = await montar({ productions: [{ id: 1 }, { id: 2, featured_image_url: 'u' }] })
        expect(de('Hero')[0].props.production).toMatchObject({ id: 2 })
        const semImagem = await montar({ productions: [{ id: 1 }] })
        expect(semImagem.de('Hero')[0].props.production).toMatchObject({ id: 1 })
    })

    it('mostra só os temas com conteúdo, o calendário e o Explore', async () => {
        const { de } = await montar({ temas: { gastronomia: tema(0), beleza: tema(1) }, aniversarios: {}, explore: [{}] })
        expect(de('Tema').map(t => t.props.chave)).toEqual(['beleza'])
        expect(de('Tema')[0].props.href).toBe('/blog?category=k-beauty')
        expect(de('Calendario')).toHaveLength(1)
        expect(de('Semana')).toHaveLength(1)
        expect(de('Explore')).toHaveLength(1)
    })
})

describe('HomeFrontPage em outro idioma', () => {
    it('sem conteúdo traduzido ficam só capa e populares, sem pular números', async () => {
        const { capitulos, de } = await montar({ locale: 'en' })
        expect(capitulos).toEqual(['1:agora', '2:dados'])
        expect(de('Loja')).toHaveLength(0)
        expect(de('Quiz')).toHaveLength(0)
        expect(de('Guias')).toHaveLength(0)
    })

    it('cada capítulo entra quando há conteúdo, com guias como assuntos', async () => {
        m.editorias.mockReturnValue([{}])
        const { capitulos, de } = await montar({
            locale: 'en', posts, guiasPorTema: [{ titulo: 'Guia', slug: 'guide', cor: '#000' }],
            pergunta: <p>pergunta</p>, temas: { gastronomia: tema(1), beleza: tema(1) },
        })
        expect(capitulos).toEqual(['1:agora', '2:editoria', '3:aprenda', '4:reportagem', '5:dados', '6:jogue', '7:temas'])
        expect((de('Assuntos')[0].props.hubs as { label: string; href: string }[])[0]).toMatchObject({ label: 'Guia', href: expect.stringContaining('guide') })
        expect(de('Tema')).toHaveLength(2)
        expect(de('Tema')[1].props.href).toContain('/en')
        expect(de('Loja')).toHaveLength(0)
    })
})

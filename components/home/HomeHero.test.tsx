// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { cloneElement, isValidElement, type ReactNode } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'
import type { ComponentProps } from 'react'

// Cobre o que a capa da home decide: uma matéria vira card único, várias viram carrossel (só a primeira
// com h1 e prioridade), sem matéria a produção em destaque (ficha, nota só com amostra, elenco na ordem do
// cadastro, plataformas, situação, classificação) e, sem nada, a capa de reserva.
const m = vi.hoisted(() => ({
    getProductionBySlug: vi.fn(),
    getArtists: vi.fn(),
    getAvaliacao: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('next/image', () => ({
    default: (p: { src: string; alt: string; priority?: boolean }) => <span data-img data-src={p.src} data-alt={p.alt} data-prioridade={String(!!p.priority)} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, 'aria-label': aria, title }: { href: string; children?: ReactNode; 'aria-label'?: string; title?: string }) => (
        <a href={href} aria-label={aria} title={title}>{children}</a>
    ),
}))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionBySlug: m.getProductionBySlug }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: m.getArtists }))
vi.mock('@/lib/tmdb/avaliacao', async (orig) => ({ ...(await orig<typeof import('@/lib/tmdb/avaliacao')>()), getAvaliacao: m.getAvaliacao }))
vi.mock('@/lib/i18n/entity-translation', () => ({ localizeEntity: (e: unknown) => e }))
vi.mock('@/lib/home/catStyle', () => ({ homeCatName: () => 'cat' }))
vi.mock('@/components/home/HeroCarousel', () => ({ HeroCarousel: (p: { children: ReactNode }) => <div data-carrossel>{p.children}</div> }))
vi.mock('@/components/home/HeroAlbum', () => ({ HeroAlbum: (p: { slug: string }) => <div data-album data-slug={p.slug} /> }))

import { HomeHero } from './HomeHero'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Props = ComponentProps<typeof HomeHero>

// A capa é composta de componentes assíncronos: o React do jsdom não os renderiza, então resolve cada um antes.
async function resolver(n: ReactNode): Promise<ReactNode> {
    if (Array.isArray(n)) return Promise.all(n.map(resolver))
    if (!isValidElement(n)) return n
    const el = n as React.ReactElement<{ children?: ReactNode }>
    if (typeof el.type === 'function') return resolver(await (el.type as (p: unknown) => ReactNode)(el.props))
    if (el.props.children === undefined) return el
    const filhos = await resolver(el.props.children)
    return cloneElement(el, undefined, ...(Array.isArray(filhos) ? filhos : [filhos]))
}
const montar = async (p: Props) => render(<>{await resolver(HomeHero(p))}</>)

let seq = 0
const post = (extra: Record<string, unknown> = {}) => ({
    id: ++seq, slug: `post-${seq}`, date: '2026-11-20T10:00:00', title: { rendered: `Título ${seq}` },
    excerpt: { rendered: '<p>Resumo do post</p>' }, content: { rendered: '<p>texto</p>' }, featured_image_url: null, ...extra,
}) as unknown as NonNullable<Props['posts']>[number]
const producao = (acf: Record<string, unknown> = {}) => ({
    id: 900, slug: 'crash', title: { rendered: 'Crash' }, featured_image_url: null, acf, ...{},
}) as unknown as NonNullable<Props['production']>
const artista = (slug: string) => ({ id: slug.length, slug, title: { rendered: slug.toUpperCase() }, featured_image_url: null })

beforeEach(() => {
    seq = 0
    vi.clearAllMocks()
    m.getProductionBySlug.mockResolvedValue(null)
    m.getArtists.mockResolvedValue({ items: [] })
    m.getAvaliacao.mockResolvedValue(null)
})
afterEach(cleanup)

describe('HomeHero — matérias', () => {
    it('uma matéria vira card único com h1 e imagem prioritária', async () => {
        const { container } = await montar({ posts: [post({ featured_image_url: 'https://x/f.jpg' })] })
        expect(container.querySelector('[data-carrossel]')).toBeNull()
        expect(container.querySelector('h1')?.textContent).toBe('Título 1')
        expect(container.querySelector('[data-img]')?.getAttribute('data-prioridade')).toBe('true')
        expect(container.querySelector('a')?.getAttribute('href')).toContain('post-1')
    })

    it('várias matérias viram carrossel; só a primeira tem h1 e prioridade, as demais h2', async () => {
        const { container } = await montar({ posts: [post({ featured_image_url: 'https://x/1.jpg' }), post({ featured_image_url: 'https://x/2.jpg' }), post()] })
        expect(container.querySelector('[data-carrossel]')).not.toBeNull()
        expect(container.querySelectorAll('h1')).toHaveLength(1)
        expect(container.querySelectorAll('h2')).toHaveLength(2)
        const prioridades = [...container.querySelectorAll('[data-img]')].map((i) => i.getAttribute('data-prioridade'))
        expect(prioridades).toEqual(['true', 'false'])
    })

    it('rótulo: "capa" na primeira e "em destaque" nas demais', async () => {
        const { container } = await montar({ posts: [post(), post()] })
        expect(container.textContent).toContain('capa')
        expect(container.textContent).toContain('emDestaque')
    })

    it('sem imagem, mostra o fundo com o ideograma; com imagem, usa o alt ou o título', async () => {
        const { container } = await montar({ posts: [post()] })
        expect(container.textContent).toContain('한류')
        cleanup()
        const outro = await montar({ posts: [post({ featured_image_url: 'https://x/f.jpg' })] })
        expect(outro.container.querySelector('[data-img]')?.getAttribute('data-alt')).toBe('Título 2')
    })

    it('o resumo é limpo de HTML e cortado em 160 caracteres', async () => {
        const longo = `<p>${'a'.repeat(300)}</p>`
        const { container } = await montar({ posts: [post({ excerpt: { rendered: longo } })] })
        const p = container.querySelector('p.line-clamp-2')!
        expect(p.textContent).toHaveLength(160)
    })

    it('sem conteúdo, não mostra os minutos de leitura', async () => {
        const { container } = await montar({ posts: [post({ content: undefined })] })
        expect(container.textContent).not.toContain('minutosDeLeitura')
        cleanup()
        const com = await montar({ posts: [post()] })
        expect(com.container.textContent).toContain('minutosDeLeitura')
    })

    it('mostra a ficha do álbum só da matéria que tem', async () => {
        const a = post()
        const b = post()
        const { container } = await montar({ posts: [a, b], albuns: { [a.id]: {} as never } })
        const albuns = container.querySelectorAll('[data-album]')
        expect(albuns).toHaveLength(1)
        expect(albuns[0].getAttribute('data-slug')).toBe(a.slug)
    })

    it('matérias têm prioridade sobre a produção', async () => {
        const { container } = await montar({ posts: [post()], production: producao() })
        expect(m.getProductionBySlug).not.toHaveBeenCalled()
        expect(container.querySelector('h1')?.textContent).toBe('Título 1')
    })
})

describe('HomeHero — produção em destaque', () => {
    it('sem ficha nem nota, o painel sai sem sinopse, elenco e nota', async () => {
        const { container } = await montar({ production: producao({ type: 'drama', year: 2024 }) })
        expect(container.querySelector('h1')?.textContent).toBe('Crash')
        expect(container.textContent).toContain('doramaEmDestaque')
        expect(container.textContent).not.toContain('/10')
        expect(m.getArtists).not.toHaveBeenCalled()
    })

    it('filme usa os rótulos de filme', async () => {
        const { container } = await montar({ production: producao({ type: 'movie' }) })
        expect(container.textContent).toContain('filmeEmDestaque')
        expect(container.textContent).toContain('tipoFilme')
    })

    it('a ficha falhar não derruba a capa', async () => {
        m.getProductionBySlug.mockRejectedValue(new Error('wp fora'))
        const { container } = await montar({ production: producao() })
        expect(container.querySelector('h1')?.textContent).toBe('Crash')
    })

    it('título e sinopse vêm da ficha; a sinopse é limpa e cortada em 220', async () => {
        m.getProductionBySlug.mockResolvedValue({ title: { rendered: 'Crash (ficha)' }, content: { rendered: `<p>${'s'.repeat(400)}</p>` } })
        const { container } = await montar({ production: producao() })
        expect(container.querySelector('h1')?.textContent).toBe('Crash (ficha)')
        expect(container.querySelector('p.line-clamp-4')!.textContent).toHaveLength(220)
    })

    it('nota só aparece com amostra confiável, com vírgula decimal', async () => {
        m.getAvaliacao.mockResolvedValue({ nota: 8.46, votos: 1_000_000 })
        const { container } = await montar({ production: producao({ tmdb_id: 1, type: 'drama' }) })
        expect(container.textContent).toContain('8,5')
        expect(container.textContent).toContain('notaVotos~{"count":1000000}')
        cleanup()
        m.getAvaliacao.mockResolvedValue({ nota: 9.9, votos: 2 })
        const poucos = await montar({ production: producao() })
        expect(poucos.container.textContent).not.toContain('9,9')
    })

    it('o elenco segue a ordem do cadastro, limita a 4 e ignora quem não tem ficha', async () => {
        m.getProductionBySlug.mockResolvedValue({
            title: { rendered: 'Crash' }, content: { rendered: '' },
            production_cast: ['e', 'd', 'c', 'b', 'a'].map((slug) => ({ slug })),
        })
        m.getArtists.mockResolvedValue({ items: [artista('a'), artista('c'), artista('d')] })
        const { container } = await montar({ production: producao() })
        expect(m.getArtists).toHaveBeenCalledWith({ slug: 'e,d,c,b', perPage: 4 })
        const nomes = [...container.querySelectorAll('li a')].map((a) => a.getAttribute('title'))
        // o pedido é e,d,c,b; só d e c têm ficha (b e e não vieram), e a ordem do pedido vence a da resposta
        expect(nomes).toEqual(['D', 'C'])
    })

    it('sem elenco cadastrado cai nos slugs de artistas; falha na busca some com o bloco', async () => {
        m.getProductionBySlug.mockResolvedValue({ title: { rendered: 'Crash' }, content: { rendered: '' }, artist_slugs: ['x', 'y'] })
        m.getArtists.mockRejectedValue(new Error('x'))
        const { container } = await montar({ production: producao() })
        expect(m.getArtists).toHaveBeenCalledWith({ slug: 'x,y', perPage: 2 })
        expect(container.textContent).not.toContain('elenco')
    })

    it('plataformas: usa a lista, cai na plataforma única e limita a 3', async () => {
        const a = await montar({ production: producao({ platforms: ['Netflix', 'Viki', 'Disney+', 'Prime', ''] }) })
        const lista = [...a.container.querySelectorAll('.border-white\\/40')].map((n) => n.textContent)
        expect(lista).toEqual(['Netflix', 'Viki', 'Disney+'])
        cleanup()
        const b = await montar({ production: producao({ platform: 'Viki' }) })
        expect(b.container.textContent).toContain('Viki')
        cleanup()
        const c = await montar({ production: producao() })
        expect(c.container.textContent).not.toContain('disponivelEm')
    })

    it.each([['airing', 'emExibicao'], ['completed', 'concluida'], ['upcoming', 'emBreve']])('situação %s vira %s na linha de meta', async (status, texto) => {
        const { container } = await montar({ production: producao({ status_production: status, year: 2024 }) })
        expect(container.textContent).toContain(texto)
    })

    it('situação desconhecida não aparece', async () => {
        const { container } = await montar({ production: producao({ status_production: 'x', year: 2024 }) })
        expect(container.textContent).not.toMatch(/emExibicao|concluida|emBreve/)
    })

    it('a linha de meta junta ano, gênero, episódios, emissora e situação', async () => {
        const { container } = await montar({ production: producao({ year: 2024, genre: 'Romance', episodes: 16, network: 'tvN', status_production: 'completed' }) })
        expect(container.textContent).toContain('2024 · Romance · 16 ep. · tvN · concluida')
    })

    it('classificação: "L" é livre e as demais ganham "+"', async () => {
        const a = await montar({ production: producao({ age_rating: 'L' }) })
        expect(a.container.textContent).toContain('classificacaoLivre')
        cleanup()
        const b = await montar({ production: producao({ age_rating: '16' }) })
        expect(b.container.textContent).toContain('16+')
    })

    it('trailer só aparece com URL, e leva à âncora da ficha', async () => {
        const sem = await montar({ production: producao() })
        expect(sem.container.querySelector('a[href$="#trailer"]')).toBeNull()
        cleanup()
        const com = await montar({ production: producao({ trailer_url: 'https://y/t' }) })
        expect(com.container.querySelector('a[href$="#trailer"]')).not.toBeNull()
    })

    it('imagem: prefere o backdrop do ACF; sem imagem, o ideograma; título original aparece', async () => {
        const a = await montar({ production: producao({ backdrop_url: 'https://x/back.jpg', original_title: '충돌' }) })
        expect(a.container.querySelector('[data-img]')?.getAttribute('data-src')).toBe('https://x/back.jpg')
        expect(a.container.textContent).toContain('충돌')
        cleanup()
        const b = await montar({ production: producao() })
        expect(b.container.textContent).toContain('한류')
    })
})

describe('HomeHero — reserva', () => {
    it('sem matéria nem produção, mostra a capa de reserva com os dois atalhos', async () => {
        const { container } = await montar({})
        expect(container.querySelector('h1')?.textContent).toBe('fallbackTitulo')
        expect(container.querySelectorAll('a')).toHaveLength(2)
    })
})

describe.skipIf(!OUTRO)('HomeHero — outro idioma', () => {
    it('os links vão para a versão do idioma da página', async () => {
        const { container } = await montar({ posts: [post()], locale: OUTRO! })
        expect(container.querySelector('a')?.getAttribute('href')).toContain(`/${OUTRO}`)
    })
})

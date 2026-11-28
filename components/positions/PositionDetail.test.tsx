// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// /positions/{posição}: só aparecem grupos com ao menos um integrante marcado naquela posição.
const m = vi.hoisted(() => ({
    getGroupsByPosition: vi.fn(),
    getArtistsByIds: vi.fn(),
    metadataDaRota: vi.fn((x: unknown) => x),
    notFound: vi.fn(() => { throw new Error('404') }),
}))

vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByPosition: m.getGroupsByPosition }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: m.getArtistsByIds }))
vi.mock('@/lib/i18n/metadata-pagina', () => ({ metadataDaRota: m.metadataDaRota }))
vi.mock('next/navigation', () => ({ notFound: m.notFound }))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, valores?: Record<string, unknown>) =>
        valores ? `${chave} ${JSON.stringify(valores)}` : chave,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-testid="anuncio" /> }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: '123' } } }))

import PositionDetailPage, { metadataDaPagina } from './PositionDetail'

const params = (position: string) => Promise.resolve({ position })
const artista = (id: number, extra: Record<string, unknown> = {}) =>
    ({ id, slug: `a${id}`, title: { rendered: `Artista ${id}` }, ...extra })
const grupo = (id: number, positions: Record<string, string[]> | undefined, members: number[] = [id]) =>
    ({ id, slug: `g${id}`, title: { rendered: `Grupo ${id}` }, member_positions: positions, acf: { members } })

async function abrir() {
    render(await PositionDetailPage({ params: params('leader') }))
}

beforeEach(() => {
    vi.clearAllMocks()
    m.getGroupsByPosition.mockResolvedValue([])
    m.getArtistsByIds.mockImplementation(async (ids: number[]) => ids.map(id => artista(id)))
})
afterEach(cleanup)

describe('metadata', () => {
    it('posição desconhecida não gera metadata', async () => {
        expect(await metadataDaPagina({ params: params('baterista') })).toEqual({})
        expect(m.metadataDaRota).not.toHaveBeenCalled()
    })

    it('posição válida usa o rótulo traduzido na rota', async () => {
        await metadataDaPagina({ params: params('leader') })
        expect(m.metadataDaRota).toHaveBeenCalledWith(expect.objectContaining({
            rota: 'position', params: { position: 'leader' }, titulo: 'detailTitle {"label":"labels.leader"}',
        }))
    })
})

describe('página', () => {
    it('posição desconhecida responde 404 sem consultar o acervo', async () => {
        await expect(PositionDetailPage({ params: params('baterista') })).rejects.toThrow('404')
        expect(m.getGroupsByPosition).not.toHaveBeenCalled()
    })

    it('lista só os integrantes marcados na posição, com foto ou inicial', async () => {
        m.getGroupsByPosition.mockResolvedValue([grupo(1, { a1: ['leader'], a2: ['visual'], a3: ['leader'] }, [1, 2, 3])])
        m.getArtistsByIds.mockResolvedValue([artista(1, { featured_image_url: '/foto.jpg' }), artista(2), artista(3)])
        await abrir()
        expect(screen.getByRole('link', { name: 'Grupo 1' }).getAttribute('href')).toBe('/groups/g1')
        expect(screen.getByRole('img').getAttribute('src')).toBe('/foto.jpg')
        expect(screen.getByRole('link', { name: /Artista 3/ }).textContent).toBe('AArtista 3')
        expect(screen.queryByText('Artista 2')).toBeNull()
    })

    it('descarta grupo sem mapa de posições, sem integrantes ou sem correspondência', async () => {
        m.getGroupsByPosition.mockResolvedValue([
            grupo(1, undefined),
            grupo(2, { a2: ['leader'] }, []),
            grupo(3, { outro: ['leader'] }),
        ])
        await abrir()
        expect(screen.queryByRole('link', { name: /Grupo/ })).toBeNull()
        expect(screen.getByText('empty')).toBeTruthy()
        expect(m.getArtistsByIds).toHaveBeenCalledTimes(1)
    })

    it('insere um anúncio a cada 20 grupos, no máximo três', async () => {
        m.getGroupsByPosition.mockResolvedValue(Array.from({ length: 85 }, (_, i) => grupo(i + 1, { [`a${i + 1}`]: ['leader'] })))
        await abrir()
        expect(screen.getAllByTestId('anuncio')).toHaveLength(3)
    })
})

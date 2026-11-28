import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

// O que a rota do fandom busca e entrega à página: 404, integrantes sem repetição, loja e torcidas parecidas.
// A página em si não é renderizada; o teste lê as props do elemento devolvido.
const m = vi.hoisted(() => ({
    getFandomBySlug: vi.fn(),
    getAllFandoms: vi.fn(),
    getArtistsByIds: vi.fn(),
    getStoreProductsByGroupId: vi.fn(),
    torcidasParecidas: vi.fn(),
    buildWordPressMetadata: vi.fn((x: unknown) => x),
    notFound: vi.fn(() => { throw new Error('404') }),
}))

vi.mock('@/lib/wordpress/fandoms', () => ({ getFandomBySlug: m.getFandomBySlug, getAllFandoms: m.getAllFandoms }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: m.getArtistsByIds }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByGroupId: m.getStoreProductsByGroupId }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (p: unknown[]) => p }))
vi.mock('@/lib/fandoms/afinidade', () => ({ torcidasParecidas: m.torcidasParecidas }))
vi.mock('@/lib/seo/wordpress', () => ({ buildWordPressMetadata: m.buildWordPressMetadata }))
vi.mock('next/navigation', () => ({ notFound: m.notFound }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/fandoms/FandomDetailPage', () => ({ FandomDetailPage: () => null }))

import { FandomDetailPage } from '@/components/fandoms/FandomDetailPage'
import FandomPage, { generateMetadata } from './FandomDetail'

const params = () => Promise.resolve({ slug: 'blink' })
const grupo = (id: number, nome: string, members?: number[]) => ({ id, slug: `g${id}`, title: { rendered: nome }, acf: { members } })
const fandom = (groups: unknown[], extra: Record<string, unknown> = {}) => ({ slug: 'blink', name: 'BLINK', groups, ...extra })
const metadata = async () => await generateMetadata({ params: params() }) as unknown as { title: string; description: string; url: string }

async function abrir() {
    const arvore = await FandomPage({ params: params() }) as ReactElement<{ children: ReactElement[] }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arvore.props.children.find(f => f.type === FandomDetailPage) as ReactElement<any>).props
}

beforeEach(() => {
    vi.clearAllMocks()
    m.getArtistsByIds.mockResolvedValue([])
    m.getAllFandoms.mockResolvedValue([])
    m.getStoreProductsByGroupId.mockResolvedValue([])
    m.torcidasParecidas.mockReturnValue([])
})

describe('generateMetadata', () => {
    it('fandom inexistente não gera metadata', async () => {
        m.getFandomBySlug.mockResolvedValue(null)
        expect(await metadata()).toEqual({})
    })

    it('um grupo, sem lightstick cadastrado: a descrição não promete lightstick', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom([grupo(1, 'BLACKPINK')]))
        const meta = await metadata()
        expect(meta.title).toBe('Fandom BLINK, a torcida do BLACKPINK')
        expect(meta.description).toContain('a torcida do grupo BLACKPINK')
        expect(meta.description).not.toContain('lightstick')
        expect(meta.url).toMatch(/\/fandoms\/blink$/)
    })

    it('dois grupos aparecem pelo nome, com o lightstick quando existe', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom([grupo(1, 'A'), grupo(2, 'B')], { lightstick: 'Bl-ping-bong' }))
        const meta = await metadata()
        expect(meta.title).toBe('Fandom BLINK, a torcida do A e B')
        expect(meta.description).toContain('dos grupos A e B')
        expect(meta.description).toContain('lightstick (Bl-ping-bong)')
    })

    it('três ou mais grupos são resumidos', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom([grupo(1, 'A'), grupo(2, 'B'), grupo(3, 'C'), grupo(4, 'D')]))
        expect((await metadata()).title).toBe('Fandom BLINK, a torcida do A, B e mais 2')
    })
})

describe('página', () => {
    it('fandom inexistente responde 404', async () => {
        m.getFandomBySlug.mockResolvedValue(null)
        await expect(FandomPage({ params: params() })).rejects.toThrow('404')
        expect(m.getArtistsByIds).not.toHaveBeenCalled()
    })

    it('busca cada integrante uma vez e não repete produto, com no máximo 8', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom([grupo(1, 'A', [10, 11]), grupo(2, 'B', [11, 12]), grupo(3, 'C')]))
        m.getStoreProductsByGroupId.mockImplementation(async (id: number) =>
            Array.from({ length: 6 }, (_, i) => ({ id: id * 3 + i })))
        const props = await abrir()
        expect(m.getArtistsByIds).toHaveBeenCalledWith([10, 11, 12])
        const ids = props.shopProducts.map((p: { id: number }) => p.id)
        expect(ids).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('torcidas parecidas saem com cor padrão e nome do primeiro grupo', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom([grupo(1, 'A')]))
        m.torcidasParecidas.mockReturnValue([
            { slug: 'once', name: 'ONCE', color: '#ff0000', groups: [grupo(2, 'TWICE')] },
            { slug: 'sem-grupo', name: 'X', groups: [] },
        ])
        expect((await abrir()).outras).toEqual([
            { slug: 'once', nome: 'ONCE', cor: '#ff0000', grupo: 'TWICE' },
            { slug: 'sem-grupo', nome: 'X', cor: '#c39bff', grupo: '' },
        ])
    })
})

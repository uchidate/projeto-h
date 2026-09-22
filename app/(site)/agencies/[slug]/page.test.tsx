// @vitest-environment jsdom
//
// Rede de segurança para a divisão futura deste arquivo (item 13 do backlog de
// organização — page.tsx tem ~1300 linhas). Não cobre cada seção condicional;
// garante que o caminho feliz renderiza com um agência bem formada e que o
// caso de agência inexistente aciona notFound(), para pegar quebras óbvias
// durante a divisão mecânica.
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WPAgency, WPArtist, WPGroup } from '@/lib/wordpress/types'

const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })
vi.mock('next/navigation', () => ({ notFound }))

// jsdom não implementa IntersectionObserver — ReadingBar observa seções da
// página para destacar o item ativo do nav; sem isso o teste quebra no efeito.
class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

const baseAgency: WPAgency = {
    id: 1,
    slug: 'hybe',
    status: 'publish',
    date: '2020-01-01T00:00:00',
    modified: '2026-01-01T00:00:00',
    title: { rendered: 'HYBE' },
    content: { rendered: '<p>Conteúdo institucional da HYBE, com história e contexto suficientes.</p>' },
    excerpt: { rendered: '<p>HYBE é uma agência de entretenimento sul-coreana.</p>' },
    featured_media: 0,
    featured_image_url: null,
    agency_type: 'major',
    accent_color: '#111111',
    country: 'KR',
    milestones: [],
    achievements: [],
    acf: {},
} as unknown as WPAgency

const baseArtist: WPArtist = {
    id: 10,
    slug: 'rm',
    status: 'publish',
    date: '2020-01-01T00:00:00',
    modified: '2020-01-01T00:00:00',
    title: { rendered: 'RM' },
    content: { rendered: '' },
    featured_media: 0,
    featured_image_url: null,
    acf: { agency: 1 },
} as unknown as WPArtist

const baseGroup: WPGroup = {
    id: 20,
    slug: 'bts',
    status: 'publish',
    date: '2020-01-01T00:00:00',
    modified: '2020-01-01T00:00:00',
    title: { rendered: 'BTS' },
    content: { rendered: '' },
    featured_media: 0,
    featured_image_url: null,
    acf: { agency: 1, active: true, debut_date: '2013-06-13' },
} as unknown as WPGroup

const emptyPosts = { items: [], total: 0, totalPages: 0 }

const { getAgencyBySlug, getAgencies } = vi.hoisted(() => ({
    getAgencyBySlug: vi.fn(),
    getAgencies: vi.fn(),
}))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyBySlug, getAgencies }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: vi.fn(async () => ({ items: [baseArtist], total: 1, totalPages: 1 })) }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: vi.fn(async () => ({ items: [baseGroup], total: 1, totalPages: 1 })) }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn(async () => emptyPosts) }))

describe('AgencyDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getAgencies.mockResolvedValue({ items: [baseAgency], total: 1, totalPages: 1 })
    })

    it('renderiza o caminho feliz com o nome da agência e o elenco relacionado', async () => {
        getAgencyBySlug.mockResolvedValue(baseAgency)
        const { default: AgencyDetailPage } = await import('./page')

        const jsx = await AgencyDetailPage({ params: Promise.resolve({ slug: 'hybe' }) })
        render(jsx)

        expect(screen.getAllByText('HYBE').length).toBeGreaterThan(0)
        expect(screen.getByText('BTS')).toBeInTheDocument()
        expect(screen.getByText('RM')).toBeInTheDocument()
    })

    it('chama notFound() quando a agência não existe', async () => {
        getAgencyBySlug.mockResolvedValue(null)
        const { default: AgencyDetailPage } = await import('./page')

        await expect(
            AgencyDetailPage({ params: Promise.resolve({ slug: 'inexistente' }) }),
        ).rejects.toThrow('NEXT_NOT_FOUND')
        expect(notFound).toHaveBeenCalledOnce()
    })

    it('não quebra quando não há grupos nem artistas relacionados', async () => {
        getAgencyBySlug.mockResolvedValue(baseAgency)
        const { getArtists } = await import('@/lib/wordpress/artists')
        const { getGroups } = await import('@/lib/wordpress/groups')
        vi.mocked(getArtists).mockResolvedValueOnce({ items: [], total: 0, totalPages: 0 })
        vi.mocked(getGroups).mockResolvedValueOnce({ items: [], total: 0, totalPages: 0 })
        const { default: AgencyDetailPage } = await import('./page')

        const jsx = await AgencyDetailPage({ params: Promise.resolve({ slug: 'hybe' }) })
        render(jsx)

        expect(screen.getAllByText('HYBE').length).toBeGreaterThan(0)
    })
})

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// /empresas/grupo/{slug}: metadata, 404, cartões das empresas e vitrine dos produtos vinculados.
const m = vi.hoisted(() => ({
    getCompaniesByChaebolGroup: vi.fn(),
    getAllCompaniesRaw: vi.fn(),
    getVitrineVinculada: vi.fn(),
    notFound: vi.fn(() => { throw new Error('404') }),
}))

vi.mock('@/lib/wordpress/companies', () => ({
    getCompaniesByChaebolGroup: m.getCompaniesByChaebolGroup,
    getAllCompaniesRaw: m.getAllCompaniesRaw,
    rotuloDoSetor: (s?: string) => (s === 'tech' ? 'Tecnologia' : null),
    emojiDoSetor: () => '🏢',
}))
vi.mock('@/lib/wordpress/vitrine', () => ({ getVitrineVinculada: m.getVitrineVinculada }))
vi.mock('next/navigation', () => ({ notFound: m.notFound }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: () => null }))

import ChaebolGroupPage, { generateMetadata, slugsPreGerados } from './ChaebolGroup'

const params = (slug = 'samsung-group') => Promise.resolve({ slug })
const empresa = (id: number, nome: string, acf: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
    ({ id, slug: `e${id}`, title: { rendered: nome }, acf, ...extra })
const resultado = (...companies: unknown[]) => ({ groupName: 'Samsung Group', companies })

beforeEach(() => {
    vi.clearAllMocks()
    m.getVitrineVinculada.mockResolvedValue([])
})
afterEach(cleanup)

describe('slugsPreGerados', () => {
    it('gera um slug por grupo empresarial, sem repetir e sem empresa avulsa', async () => {
        m.getAllCompaniesRaw.mockResolvedValue([
            empresa(1, 'A', { chaebol_group: 'Samsung Group' }),
            empresa(2, 'B', { chaebol_group: 'Samsung Group' }),
            empresa(3, 'C', { chaebol_group: 'LG Group' }),
            empresa(4, 'D'),
        ])
        expect(await slugsPreGerados()).toEqual([{ slug: 'samsung-group' }, { slug: 'lg-group' }])
    })

    it('com o WordPress fora não gera nenhum', async () => {
        m.getAllCompaniesRaw.mockRejectedValue(new Error('WP fora'))
        expect(await slugsPreGerados()).toEqual([])
    })
})

describe('generateMetadata', () => {
    it('lista as empresas na descrição e aponta o canonical para o grupo', async () => {
        m.getCompaniesByChaebolGroup.mockResolvedValue(resultado(empresa(1, 'Samsung Electronics'), empresa(2, 'Samsung SDI')))
        const meta = await generateMetadata({ params: params() })
        expect(meta.title).toBe('Samsung Group — todas as empresas do grupo')
        expect(meta.description).toContain('Samsung Electronics, Samsung SDI.')
        expect(String(meta.alternates?.canonical)).toMatch(/\/empresas\/grupo\/samsung-group$/)
    })

    it('grupo inexistente não gera metadata', async () => {
        m.getCompaniesByChaebolGroup.mockResolvedValue(null)
        expect(await generateMetadata({ params: params() })).toEqual({})
    })
})

describe('página', () => {
    it('grupo inexistente responde 404', async () => {
        m.getCompaniesByChaebolGroup.mockResolvedValue(null)
        await expect(ChaebolGroupPage({ params: params() })).rejects.toThrow('404')
    })

    it('mostra cada empresa com link, setor e logo ou emoji, com contagem no plural', async () => {
        m.getCompaniesByChaebolGroup.mockResolvedValue(resultado(
            empresa(1, 'Samsung Electronics', { industry: 'tech' }, { featured_image_url: '/logo.png' }),
            empresa(2, 'Samsung SDI'),
        ))
        render(await ChaebolGroupPage({ params: params() }))
        expect(screen.getByRole('link', { name: /Samsung Electronics/ }).getAttribute('href')).toBe('/empresas/e1')
        expect(screen.getByRole('img').getAttribute('src')).toBe('/logo.png')
        expect(screen.getByText('Tecnologia')).toBeTruthy()
        expect(screen.getByText('🏢')).toBeTruthy()
        expect(screen.getByText(/2 empresas ligadas ao Samsung Group/)).toBeTruthy()
        expect(m.getVitrineVinculada).not.toHaveBeenCalled()
    })

    it('com uma empresa usa o singular e busca a vitrine pelos produtos e marcas', async () => {
        m.getCompaniesByChaebolGroup.mockResolvedValue(resultado(
            empresa(1, 'Samsung Electronics', { linked_products: [5, 6], global_brands: ['Galaxy'] }),
        ))
        render(await ChaebolGroupPage({ params: params() }))
        expect(screen.getByText(/1 empresa ligada ao Samsung Group/)).toBeTruthy()
        expect(m.getVitrineVinculada).toHaveBeenCalledWith(
            [5, 6], ['Samsung Group', 'Samsung Electronics', 'Galaxy'], 'empresas-grupo:samsung-group', { limit: 12 },
        )
    })
})

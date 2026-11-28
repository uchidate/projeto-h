// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

const m = vi.hoisted(() => ({ empresas: vi.fn(), vitrine: vi.fn(), idiomas: vi.fn() }))

vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: m.idiomas }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => <div data-testid="anuncio" /> }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: '123' } } }))
vi.mock('@/lib/wordpress/companies', async (original) => ({
    ...await original<typeof import('@/lib/wordpress/companies')>(),
    getCompanies: m.empresas,
}))
vi.mock('@/lib/wordpress/vitrine', () => ({ buildVitrineMatcher: m.vitrine }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import EmpresasPage, { generateMetadata } from './EmpresasIndex'
import { COMPANY_INDUSTRY_LABELS } from '@/lib/wordpress/companies'

const SETOR = Object.keys(COMPANY_INDUSTRY_LABELS)[0] as keyof typeof COMPANY_INDUSTRY_LABELS
const abrir = async (sp: Record<string, string> = {}) => render(await EmpresasPage({ searchParams: Promise.resolve(sp) }) as ReactElement)
const resposta = (items: unknown[], total = items.length, totalPages = 1) => ({ items, total, totalPages })
const empresa = (id: number, extra: Record<string, unknown> = {}) => ({ id, slug: `e${id}`, title: { rendered: `Empresa ${id}` }, ...extra })

beforeEach(() => {
    m.empresas.mockReset().mockResolvedValue(resposta([]))
    m.vitrine.mockReset().mockResolvedValue((termos: string[]) => termos.includes('Marca'))
    m.idiomas.mockReset().mockResolvedValue(null)
})
afterEach(cleanup)

describe('EmpresasIndex', () => {
    it('metadata inclui os idiomas só quando existem', async () => {
        expect((await generateMetadata()).alternates).not.toHaveProperty('languages')
        m.idiomas.mockResolvedValue({ en: 'https://exemplo.test/en/companies' })
        expect((await generateMetadata()).alternates?.languages).toEqual({ en: 'https://exemplo.test/en/companies' })
    })

    it('ignora setor desconhecido e página inválida', async () => {
        await abrir({ industry: 'nada', page: '-3' })
        expect(m.empresas).toHaveBeenCalledWith(expect.objectContaining({ page: 1, industry: undefined, chaebol: undefined, perPage: 48 }))
        expect(screen.getByText('Nenhuma empresa encontrada')).toBeTruthy()
        expect(screen.queryByTestId('anuncio')).toBeNull()
    })

    it('lista a empresa com seus dados e o selo da loja', async () => {
        m.empresas.mockResolvedValue(resposta([
            empresa(1, { featured_image_url: 'https://exemplo.test/e.png', acf: { name_korean: '회사', industry: SETOR, founded_year: 1969, is_chaebol: true, famous_products: ['A', 'B', 'C', 'D'], global_brands: ['Marca'] } }),
            empresa(2),
        ]))
        await abrir()
        expect(screen.getByText('2 empresas')).toBeTruthy()
        expect(screen.getByRole('link', { name: /Empresa 1/ }).getAttribute('href')).toBe('/empresas/e1')
        expect(screen.getByRole('img', { name: 'Empresa 1' })).toBeTruthy()
        expect(screen.getByText('회사')).toBeTruthy()
        expect(screen.getByText('Est. 1969')).toBeTruthy()
        expect(screen.getByText('A · B · C')).toBeTruthy()
        expect(screen.getAllByText('🛍️ Na loja')).toHaveLength(1)
        expect(screen.getByTestId('anuncio')).toBeTruthy()
        expect(screen.queryByText(/Página 1 de/)).toBeNull()
    })

    it('com filtro e várias páginas mantém o setor na paginação', async () => {
        m.empresas.mockResolvedValue(resposta([empresa(1)], 1, 3))
        await abrir({ industry: SETOR, page: '2', chaebol: 'true' })
        expect(screen.getByText(`1 empresa em ${COMPANY_INDUSTRY_LABELS[SETOR]} (Chaebols)`)).toBeTruthy()
        expect(screen.getByRole('link', { name: '← Anterior' }).getAttribute('href')).toBe(`/empresas?page=1&industry=${SETOR}`)
        expect(screen.getByRole('link', { name: 'Próxima →' }).getAttribute('href')).toBe(`/empresas?page=3&industry=${SETOR}`)
    })
})

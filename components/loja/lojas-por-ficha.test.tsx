// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// /loja/empresa/{slug} e /loja/comida/{slug}: vitrine ligada à ficha.
const m = vi.hoisted(() => ({ empresa: vi.fn(), comida: vi.fn(), vitrine: vi.fn() }))

vi.mock('@/lib/wordpress/companies', () => ({ getCompanyBySlug: m.empresa }))
vi.mock('@/lib/wordpress/foods', () => ({ getFoodBySlug: m.comida }))
vi.mock('@/lib/wordpress/vitrine', () => ({ getVitrineVinculada: m.vitrine }))
vi.mock('@/components/ui/StoreCard', () => ({ StoreCard: ({ product, contexto }: { product: { id: number }; contexto: string }) => <div data-testid="produto">{`${product.id}@${contexto}`}</div> }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404') } }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import Empresa, { generateMetadata as metaEmpresa } from './LojaEmpresa'
import Comida, { generateMetadata as metaComida } from './LojaComida'

const params = (slug: string) => Promise.resolve({ slug })
const ficha = (nome: string, acf: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
    ({ id: 1, title: { rendered: nome }, acf, ...extra })

beforeEach(() => {
    m.empresa.mockReset()
    m.comida.mockReset()
    m.vitrine.mockReset().mockResolvedValue([])
})
afterEach(cleanup)

describe.each([
    {
        rotulo: 'empresa', Pagina: Empresa, meta: metaEmpresa, busca: m.empresa, slug: 'lg', ficha: '/empresas/lg',
        acf: { linked_products: [7], global_brands: ['Marca'], famous_products: ['Item'] },
        termos: ['Nome', 'Marca', 'Item'], opcoes: { limit: 60 }, vazio: 'Ainda não temos produtos de Nome na loja.',
    },
    {
        rotulo: 'comida', Pagina: Comida, meta: metaComida, busca: m.comida, slug: 'kimchi', ficha: '/comidas/kimchi',
        acf: { linked_products: [7], main_ingredients: ['acelga'] },
        termos: ['Nome', 'acelga'], opcoes: { limit: 60, temas: ['culinaria'] }, vazio: 'Ainda não temos produtos para Nome na loja.',
    },
])('loja de $rotulo', ({ rotulo, Pagina, meta, busca, slug, ficha: voltar, acf, termos, opcoes, vazio }) => {
    const contexto = `loja_${rotulo}:${slug}`

    it('responde 404 e metadata vazia para ficha inexistente', async () => {
        busca.mockResolvedValue(null)
        expect(await meta({ params: params(slug) })).toEqual({})
        await expect(Pagina({ params: params(slug) })).rejects.toThrow('404')
    })

    it('metadata com canonical da própria loja', async () => {
        busca.mockResolvedValue(ficha('Nome'))
        const dados = await meta({ params: params(slug) })
        expect(dados.title).toBe('Loja Nome')
        expect(String(dados.alternates?.canonical)).toMatch(new RegExp(`/loja/${rotulo}/${slug}$`))
    })

    it('busca a vitrine pelos termos da ficha e lista os produtos', async () => {
        busca.mockResolvedValue(ficha('Nome', acf, { featured_image_url: 'https://exemplo.test/x.jpg' }))
        m.vitrine.mockResolvedValue([{ id: 7 }, { id: 8 }])
        render(await Pagina({ params: params(slug) }) as ReactElement)
        expect(m.vitrine).toHaveBeenCalledWith([7], termos, contexto, opcoes)
        expect(screen.getAllByTestId('produto').map(e => e.textContent)).toEqual([`7@${contexto}`, `8@${contexto}`])
        expect(screen.getByText('2 produtos')).toBeTruthy()
        expect(screen.getByRole('img')).toBeTruthy()
        expect(screen.getByRole('link', { name: /Ver ficha de Nome/ }).getAttribute('href')).toBe(voltar)
    })

    it('sem produtos explica e aponta para a loja inteira', async () => {
        busca.mockResolvedValue({ id: 1, title: { rendered: 'Nome' } })
        render(await Pagina({ params: params(slug) }) as ReactElement)
        expect(screen.getByText(vazio)).toBeTruthy()
        expect(screen.getByText('0 produtos')).toBeTruthy()
        expect(screen.queryByRole('img')).toBeNull()
        expect(screen.getAllByRole('link', { name: /Ver a loja inteira/ })[0].getAttribute('href')).toBe('/loja')
    })
})

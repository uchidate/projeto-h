// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// /groups/{slug} em português: páginas por tipo (girl-groups, solos…) ou a ficha do grupo.
const m = vi.hoisted(() => ({
    getGroups: vi.fn(),
    buildGroupMetadata: vi.fn(),
}))

vi.mock('@/lib/wordpress/groups', () => ({ getGroups: m.getGroups }))
vi.mock('@/components/groups/GroupRoute', () => ({ GroupRoute: () => null, buildGroupMetadata: m.buildGroupMetadata }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))

import { GroupRoute } from '@/components/groups/GroupRoute'
import GroupPage, { generateMetadata, slugsPreGerados } from './GroupSlugPage'

const params = (slug: string) => Promise.resolve({ slug })
const grupo = (id: number, extra: Record<string, unknown> = {}) =>
    ({ id, slug: `g${id}`, title: { rendered: `Grupo ${id}` }, acf: {}, ...extra })

beforeEach(() => {
    m.getGroups.mockReset()
    m.buildGroupMetadata.mockReset()
})
afterEach(cleanup)

describe('slugsPreGerados', () => {
    const TIPOS = ['girl-groups', 'boy-groups', 'grupos-mistos', 'solos'].map(slug => ({ slug }))

    it('junta as páginas por tipo e os grupos de todas as páginas da API', async () => {
        m.getGroups.mockImplementation(async ({ page = 1 }: { page?: number }) => ({ items: [grupo(page)], totalPages: 3 }))
        expect(await slugsPreGerados()).toEqual([...TIPOS, { slug: 'g1' }, { slug: 'g2' }, { slug: 'g3' }])
    })

    it('com o WordPress fora gera ao menos as páginas por tipo', async () => {
        m.getGroups.mockRejectedValue(new Error('WP fora'))
        expect(await slugsPreGerados()).toEqual(TIPOS)
    })
})

describe('generateMetadata', () => {
    it('página por tipo tem título, canonical e imagem social próprios', async () => {
        const meta = await generateMetadata({ params: params('girl-groups') })
        expect(meta.title).toBe('Girl Groups K-Pop')
        expect(String(meta.alternates?.canonical)).toMatch(/\/groups\/girl-groups$/)
        expect(meta.twitter?.images).toHaveLength(1)
        expect(m.buildGroupMetadata).not.toHaveBeenCalled()
    })

    it('outro slug usa a metadata da ficha em português', async () => {
        m.buildGroupMetadata.mockResolvedValue({ title: 'aespa' })
        expect(await generateMetadata({ params: params('aespa') })).toEqual({ title: 'aespa' })
        expect(m.buildGroupMetadata).toHaveBeenCalledWith('aespa', 'pt')
    })
})

describe('GroupPage', () => {
    it('outro slug entrega a ficha do grupo', async () => {
        const el = await GroupPage({ params: params('aespa') }) as ReactElement<{ slug: string; locale: string }>
        expect(el.type).toBe(GroupRoute)
        expect(el.props).toEqual({ slug: 'aespa', locale: 'pt' })
        expect(m.getGroups).not.toHaveBeenCalled()
    })

    it('página por tipo consulta o tipo certo e lista cada grupo com seus dados', async () => {
        m.getGroups.mockResolvedValue({ items: [
            grupo(1, { featured_image_url: 'https://exemplo.test/g1.jpg', acf: { name_hangul: '하나', debut_date: '2020-11-17', fandom_name: 'MY', color: '#ff0000' } }),
            grupo(2, { acf: { active: false } }),
        ] })
        render(await GroupPage({ params: params('boy-groups') }) as ReactElement)
        expect(m.getGroups).toHaveBeenCalledWith(expect.objectContaining({ type: 'boy_group' }))
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Boy Groups K-Pop')
        expect(screen.getByText('2 grupos')).toBeTruthy()
        expect(screen.getByRole('link', { name: /Grupo 1/ }).getAttribute('href')).toBe('/groups/g1')
        expect(screen.getByRole('img', { name: 'Grupo 1' })).toBeTruthy()
        expect(screen.getByText('하나')).toBeTruthy()
        expect(screen.getByText('Est. 2020')).toBeTruthy()
        expect(screen.getByText('MY')).toBeTruthy()
        expect(screen.getAllByText('Inativo')).toHaveLength(1)
    })

    it('conta no singular quando há um só grupo', async () => {
        m.getGroups.mockResolvedValue({ items: [grupo(1)] })
        render(await GroupPage({ params: params('solos') }) as ReactElement)
        expect(screen.getByText('1 grupo')).toBeTruthy()
    })

    it('categoria vazia explica e leva de volta à lista', async () => {
        m.getGroups.mockResolvedValue({ items: [] })
        render(await GroupPage({ params: params('grupos-mistos') }) as ReactElement)
        expect(screen.getByText('Nenhum grupo encontrado')).toBeTruthy()
        expect(screen.getAllByRole('link', { name: /Ver todos os grupos/ })[0].getAttribute('href')).toBe('/groups')
    })
})

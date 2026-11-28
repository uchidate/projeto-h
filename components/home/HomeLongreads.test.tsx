// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import type { WPPost } from '@/lib/wordpress/types'

vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string, v?: object) => (v ? `${k} ${JSON.stringify(v)}` : k) }))
vi.mock('@/components/home/postLink', () => ({ postLink: (slug: string) => ({ href: `/blog/${slug}` }) }))
vi.mock('@/lib/home/catStyle', () => ({ homeCatName: () => 'Categoria' }))
vi.mock('@/components/ui/SectionTitleBar', () => ({ SectionTitleBar: ({ title }: { title: string }) => <h2>{title}</h2> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { HomeLongreads } from './HomeLongreads'

const post = (id: number, extra: Record<string, unknown> = {}) =>
    ({ id, slug: `p${id}`, date: '2026-11-17T12:00:00', title: { rendered: `Post ${id}` }, ...extra }) as unknown as WPPost

afterEach(cleanup)

describe('HomeLongreads', () => {
    it('não aparece sem artigos', async () => {
        expect(await HomeLongreads({ posts: [] })).toBeNull()
    })

    it('destaca o primeiro e lista os demais, com tempo de leitura quando há', async () => {
        render(await HomeLongreads({ posts: [
            post(1, { featured_image_url: 'https://exemplo.test/1.jpg', excerpt: { rendered: '<p>Resumo</p>' }, acf: { reading_time: 7 } }),
            post(2, { content: { rendered: '<p>texto curto</p>' } }),
            post(3),
        ] }) as ReactElement)
        expect(screen.getByRole('link', { name: /Post 1/ }).getAttribute('href')).toBe('/blog/p1')
        expect(screen.getByRole('img', { name: 'Post 1' })).toBeTruthy()
        expect(screen.getByText('Resumo')).toBeTruthy()
        expect(screen.getByText(/minutosDeLeitura \{"mins":7\} · 17 de nov/)).toBeTruthy()
        expect(screen.getAllByText(/minutosDeLeitura/)).toHaveLength(2)
        expect(screen.getByText('17 de nov')).toBeTruthy()
    })
})

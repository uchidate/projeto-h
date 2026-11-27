// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { WPPost } from '@/lib/wordpress/types'

// Datas do artigo traduzido: o WordPress entrega horário de São Paulo sem fuso, e o
// servidor roda em UTC.
// eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
vi.mock('next/image', () => ({ default: (p: { src: string; alt?: string }) => <img src={p.src} alt={p.alt ?? ''} /> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({ default: (p: { href: string; children?: ReactNode }) => <a href={p.href}>{p.children}</a> }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (chave: string, valores?: Record<string, unknown>) => (valores ? `${chave} ${JSON.stringify(valores)}` : chave) }))
vi.mock('@/lib/blog/produtosDosBlocos', () => ({ getProdutosDosBlocos: async () => [] }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: unknown }) => <script data-jsonld="">{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/blog/GutenbergArticleRenderer', () => ({ GutenbergArticleRenderer: () => null }))
vi.mock('@/components/analytics/RastreioDeLeitura', () => ({ RastreioDeLeitura: () => null }))

import { LocalizedPost, buildLocalizedPostMetadata } from './LocalizedPost'

const post = {
    id: 5, slug: 'article', date: '2026-11-27T01:30:00', modified: '2026-11-27T02:00:00',
    title: { rendered: 'Article title' }, excerpt: { rendered: '<p>Short summary.</p>' },
    content: { rendered: '<p>Body.</p>' }, acf: {}, meta: {}, _embedded: {}, translations: { pt: 'artigo', en: 'article' },
} as unknown as WPPost

const fusoOriginal = process.env.TZ
afterEach(() => {
    cleanup()
    if (fusoOriginal === undefined) delete process.env.TZ
    else process.env.TZ = fusoOriginal
})

describe('LocalizedPost — datas', () => {
    it('num servidor em UTC, post da madrugada mostra o dia de São Paulo', async () => {
        process.env.TZ = 'UTC'
        const { container } = render(await LocalizedPost({ post, locale: 'en' }))
        expect(container.textContent).toContain('November 27, 2026')
    })

    it('JSON-LD e Open Graph levam o fuso', async () => {
        const { container } = render(await LocalizedPost({ post, locale: 'en' }))
        const artigo = Array.from(container.querySelectorAll('script[data-jsonld]')).map(s => s.textContent ?? '').find(s => s.includes('BlogPosting'))
        expect(artigo).toContain('"datePublished":"2026-11-27T01:30:00-03:00"')
        expect(artigo).toContain('"dateModified":"2026-11-27T02:00:00-03:00"')
        expect(buildLocalizedPostMetadata(post, 'en').openGraph).toMatchObject({
            publishedTime: '2026-11-27T01:30:00-03:00',
            modifiedTime: '2026-11-27T02:00:00-03:00',
        })
    })
})

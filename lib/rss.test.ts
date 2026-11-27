// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { WPPost } from '@/lib/wordpress/types'
import { buildPostsRss } from './rss'

const post = (extra: Record<string, unknown> = {}) => ({
    id: 1,
    slug: 'show-no-kspo',
    date: '2026-11-26T23:17:15',
    title: { rendered: 'Show &amp; <em>esgotado</em>' },
    excerpt: { rendered: `<p>${'a'.repeat(400)}</p>` },
    ...extra,
}) as unknown as WPPost

const feed = (posts: WPPost[]) => buildPostsRss(posts, { selfUrl: 'https://exemplo.test/feed.xml?a=1&b=2' })
const xml = (texto: string) => new DOMParser().parseFromString(texto, 'application/xml')

describe('buildPostsRss', () => {
    it('publica o instante real mesmo num servidor em UTC: a data do WordPress é horário de São Paulo', () => {
        vi.stubEnv('TZ', 'UTC')
        expect(feed([post()])).toContain('<pubDate>Fri, 27 Nov 2026 02:17:15 GMT</pubDate>')
        vi.unstubAllEnvs()
    })

    it('gera XML válido, com título sem HTML, resumo cortado e link do artigo', () => {
        const doc = xml(feed([post()]))
        expect(doc.querySelector('parsererror')).toBeNull()
        const item = doc.querySelector('item')!
        expect(item.querySelector('title')!.textContent).toContain('esgotado')
        expect(item.querySelector('title')!.textContent).not.toContain('<em>')
        expect(item.querySelector('description')!.textContent).toHaveLength(300)
        expect(item.querySelector('link')!.textContent).toMatch(/\/blog\/show-no-kspo$/)
    })

    it('escapa o endereço do próprio feed e as categorias', () => {
        const saida = feed([post({ _embedded: { 'wp:term': [[{ name: 'Música & "shows"' }]] } })])
        expect(saida).toContain('feed.xml?a=1&amp;b=2')
        expect(saida).toContain('<category>Música &amp; &quot;shows&quot;</category>')
    })

    it('só inclui mídia quando há imagem', () => {
        expect(feed([post()])).not.toContain('<enclosure')
        expect(feed([post({ featured_image_url: 'https://exemplo.test/capa.jpg' })])).toContain('<enclosure url="https://exemplo.test/capa.jpg"')
    })
})

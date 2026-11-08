import { describe, expect, it } from 'vitest'
import { comCapaDoOriginal } from './translations'
import type { WPPost } from '@/lib/wordpress/types'

const post = (extra: Partial<WPPost>) => ({ featured_media: 0, ...extra }) as WPPost

describe('comCapaDoOriginal', () => {
    it('usa a capa do original quando a tradução ficou com a antiga', () => {
        const original = post({ featured_media: 35201, featured_image_url: 'https://x/ive.jpg', _embedded: { 'wp:featuredmedia': [{ source_url: 'https://x/ive.jpg' } as never] } })
        const traduzido = post({ featured_media: 26176, featured_image_url: 'https://x/222.png' })
        const r = comCapaDoOriginal(traduzido, original)
        expect(r.featured_image_url).toBe('https://x/ive.jpg')
        expect(r.featured_media).toBe(35201)
        expect(r._embedded?.['wp:featuredmedia']).toHaveLength(1)
    })

    it('mantém a capa da tradução se o original não tem', () => {
        const traduzido = post({ featured_media: 5, featured_image_url: 'https://x/t.jpg' })
        expect(comCapaDoOriginal(traduzido, post({}))).toBe(traduzido)
        expect(comCapaDoOriginal(traduzido, null)).toBe(traduzido)
    })
})

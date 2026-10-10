import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WPPost } from '@/lib/wordpress/types'

const wp = vi.hoisted(() => ({ posts: {} as Record<string, unknown>, chamadas: [] as string[] }))
vi.mock('@/lib/wordpress/posts', () => ({
    getPostBySlug: async (slug: string, lang?: string) => {
        wp.chamadas.push(`${lang ?? 'pt'}:${slug}`)
        return wp.posts[`${lang ?? 'pt'}:${slug}`] ?? null
    },
}))

import { resolverPostIntl } from './resolverPostIntl'

const post = (slug: string, translations: Record<string, string>) => ({ slug, translations }) as unknown as WPPost

describe('resolverPostIntl', () => {
    beforeEach(() => { wp.posts = {}; wp.chamadas = [] })

    it('slug do original com tradução publicada: serve a tradução, sem redirecionar', async () => {
        wp.posts['pt:meu-post'] = post('meu-post', { pt: 'meu-post', en: 'my-post' })
        wp.posts['en:my-post'] = post('my-post', { pt: 'meu-post', en: 'my-post' })
        const r = await resolverPostIntl('meu-post', 'en')
        expect(r).toMatchObject({ tipo: 'traduzido' })
        expect(r.tipo === 'traduzido' && r.post.slug).toBe('my-post')
    })

    it('slug antigo da tradução: redireciona para o slug do original', async () => {
        wp.posts['en:my-post'] = post('my-post', { pt: 'meu-post', en: 'my-post' })
        expect(await resolverPostIntl('my-post', 'en')).toEqual({ tipo: 'redirecionar', slug: 'meu-post' })
    })

    it('original sem tradução: fallback em português', async () => {
        wp.posts['pt:meu-post'] = post('meu-post', { pt: 'meu-post' })
        expect(await resolverPostIntl('meu-post', 'en')).toEqual({ tipo: 'original' })
    })

    it('tradução listada mas não publicada: fallback, sem redirecionar para si mesmo', async () => {
        wp.posts['pt:meu-post'] = post('meu-post', { pt: 'meu-post', en: 'my-post' })
        expect(await resolverPostIntl('meu-post', 'en')).toEqual({ tipo: 'original' })
    })

    it('tradução sem original vinculado: serve a própria', async () => {
        wp.posts['en:solo'] = post('solo', { en: 'solo' })
        expect(await resolverPostIntl('solo', 'en')).toMatchObject({ tipo: 'traduzido' })
    })

    it('slug inexistente: fallback (a página em português dá 404)', async () => {
        expect(await resolverPostIntl('nada', 'en')).toEqual({ tipo: 'original' })
    })
})

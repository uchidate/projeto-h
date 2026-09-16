import { describe, it, expect } from 'vitest'
import { isWPPostType, getWPCollectionTag, getWPItemTag, WP_CACHE_TAGS } from './cache'

describe('isWPPostType', () => {
    it('accepts every known type', () => {
        for (const t of ['post', 'production', 'artist', 'group', 'agency', 'food', 'company', 'music_release']) {
            expect(isWPPostType(t)).toBe(true)
        }
    })

    // Regressão: o webhook de revalidate rejeitava (400) music_release até
    // 2026-07-04, porque não estava no union type — cache nunca invalidava.
    it('accepts music_release specifically', () => {
        expect(isWPPostType('music_release')).toBe(true)
    })

    it('rejects unknown types instead of silently passing', () => {
        expect(isWPPostType('quiz_question')).toBe(false)
        expect(isWPPostType('guia')).toBe(false)
        expect(isWPPostType('')).toBe(false)
        expect(isWPPostType(undefined)).toBe(false)
        expect(isWPPostType(123)).toBe(false)
    })
})

describe('getWPCollectionTag', () => {
    it('returns the exact tag string used by fetch(...) call sites', () => {
        // Se este valor divergir de uma tag manual em lib/wordpress/*.ts,
        // a invalidação de cache silenciosamente para de funcionar para esse
        // tipo (foi o caso de music_release, com tag manual 'music-releases').
        expect(getWPCollectionTag('music_release')).toBe(WP_CACHE_TAGS.musicReleases)
        expect(getWPCollectionTag('production')).toBe(WP_CACHE_TAGS.productions)
    })
})

describe('getWPItemTag', () => {
    it('builds a "{type}-{slug}" tag', () => {
        expect(getWPItemTag('artist', 'jimin')).toBe('artist-jimin')
    })
})

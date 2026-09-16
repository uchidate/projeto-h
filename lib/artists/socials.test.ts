import { describe, it, expect } from 'vitest'
import { buildSocialEntries } from './socials'

describe('buildSocialEntries', () => {
    // Este é o caminho de dados real que ArtistDetailPage.tsx usa pro seu
    // MusicGroup/Person sameAs — ao contrário do buildSameAsUrls (removido em
    // 2026-07-05 por reprefixar URLs já completas, gerando
    // "https://x.com/https://x.com/BTS_twt"), este passa por getSocialUrl,
    // que já trata URL completa vs. handle cru corretamente.
    it('passes through an already-complete twitter/x URL without double-prefixing', () => {
        const entries = buildSocialEntries({ twitter: 'https://x.com/BTS_twt' })
        expect(entries.find(e => e.key === 'x')?.url).toBe('https://x.com/BTS_twt')
    })

    it('builds a full instagram URL from a bare handle', () => {
        const entries = buildSocialEntries({ instagram: 'j.m' })
        expect(entries.find(e => e.key === 'instagram')?.url).toBe('https://www.instagram.com/j.m/')
    })

    it('passes through already-complete youtube and spotify URLs unchanged', () => {
        const entries = buildSocialEntries({
            youtube: 'https://youtube.com/@bts',
            spotify: 'https://open.spotify.com/artist/abc',
        })
        expect(entries.find(e => e.key === 'youtube')?.url).toBe('https://youtube.com/@bts')
        expect(entries.find(e => e.key === 'spotify')?.url).toBe('https://open.spotify.com/artist/abc')
    })

    // Antes de 2026-07-05, youtube/tiktok/spotify não passavam por getSocialUrl —
    // um handle cru (em vez de URL completa) vinha de propósito futuro: hoje
    // 100% dos valores no WP já são URLs completas, mas um editor pode digitar
    // só o handle no futuro. Agora constrói a URL corretamente nesse caso.
    it('builds a full URL from a bare youtube/tiktok/spotify handle too', () => {
        const entries = buildSocialEntries({ youtube: '@bts', tiktok: 'bts_official', spotify: '3AA28KZvwAUcZuOKwyblJQ' })
        expect(entries.find(e => e.key === 'youtube')?.url).toBe('https://www.youtube.com/@bts')
        expect(entries.find(e => e.key === 'tiktok')?.url).toBe('https://www.tiktok.com/@bts_official')
        expect(entries.find(e => e.key === 'spotify')?.url).toBe('https://open.spotify.com/artist/3AA28KZvwAUcZuOKwyblJQ')
    })

    it('omits fields that are absent, without inserting empty entries', () => {
        const entries = buildSocialEntries({ instagram: 'j.m' })
        expect(entries).toHaveLength(1)
    })

    it('returns an empty list when no social field is set', () => {
        expect(buildSocialEntries({})).toHaveLength(0)
    })

    it('rejects a malformed instagram handle instead of producing a broken URL', () => {
        const entries = buildSocialEntries({ instagram: 'has spaces/slash' })
        expect(entries.find(e => e.key === 'instagram')).toBeUndefined()
    })
})

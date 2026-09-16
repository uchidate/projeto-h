import { describe, expect, it } from 'vitest'
import type { WPArtist } from '@/lib/wordpress/types'
import { buildArtistProfileModel } from '@/lib/profiles/artistProfile'
import { isInterstitial, type ProfileBlockDef } from './ProfileSection'
import { buildArtistProfileEntries } from './ArtistProfileBlocks'
import { ptTranslator } from '@/lib/i18n/testing'

const profileT = ptTranslator('profile')

function artist(acf: WPArtist['acf'] = {}, content = '<p>Biografia suficientemente longa para exibição.</p>'): WPArtist {
    return {
        id: 1, slug: 'artista', status: 'publish', date: '2020-01-01', modified: '2020-01-01',
        title: { rendered: 'Artista' }, content: { rendered: content }, featured_media: 0, acf,
    }
}

function visibleIds(profile: WPArtist) {
    return buildArtistProfileEntries({
        t: profileT,
        model: buildArtistProfileModel(profile),
        productions: [], groups: [], discography: [], relatedArtists: [], relatedPosts: [],
        faqItems: [{ question: 'Quem é?', answer: 'Uma artista.' }],
    }).filter((entry): entry is ProfileBlockDef => !isInterstitial(entry) && entry.present).map(entry => entry.id)
}

function interstitialKeys(profile: WPArtist) {
    return buildArtistProfileEntries({
        t: profileT,
        model: buildArtistProfileModel(profile),
        productions: [], groups: [], discography: [], relatedArtists: [], relatedPosts: [],
        faqItems: [],
    }).filter(isInterstitial).map(entry => entry.key)
}

describe('buildArtistProfileEntries', () => {
    it('mantém a ordem narrativa canônica', () => {
        const ids = visibleIds(artist({
            essencia_virada: 'Virada',
            mv_url: 'https://youtube.com/watch?v=abcdefghijk',
            spotify: 'https://open.spotify.com/artist/123',
            milestones: ['2020|Estreia'],
            awards: ['2024|Prêmio'],
            curiosidades: ['Fato'],
            instagram: '@artista',
        }))

        // 'mv' e 'spotify' eram seções irmãs; agora vivem dentro de 'musica',
        // junto com a discografia.
        expect(ids).toEqual([
            'biografia', 'marcos', 'premios', 'essencia',
            'musica', 'curiosidades', 'redes', 'faq',
        ])
    })

    it('omite seções sem dados e conserva o FAQ', () => {
        expect(visibleIds(artist({}, ''))).toEqual(['faq'])
    })

    it('não publica prêmio ou marcos quando só há pipes inválidos', () => {
        const ids = visibleIds(artist({ awards: ['inválido'], milestones: ['inválido'] }))
        expect(ids).not.toContain('premios')
        expect(ids).not.toContain('marcos')
    })

    it('não publica trajetória nem recordes sem story_chapters/key_metrics', () => {
        const ids = visibleIds(artist({}))
        expect(ids).not.toContain('trajetoria')
        expect(ids).not.toContain('recordes')
    })

    it('mantém somente um anúncio inline no fluxo', () => {
        expect(interstitialKeys(artist())).toContain('inline-ad')
        expect(interstitialKeys(artist({
            story_chapters: Array.from({ length: 5 }, (_, index) => ({
                period: `${2020 + index}`,
                title: `Capítulo ${index + 1}`,
                description: 'História',
                source_url: 'https://example.com',
            })),
        }))).toEqual(expect.arrayContaining(['story-feed-ad']))
        expect(interstitialKeys(artist({
            story_chapters: Array.from({ length: 5 }, (_, index) => ({
                period: `${2020 + index}`,
                title: `Capítulo ${index + 1}`,
                description: 'História',
                source_url: 'https://example.com',
            })),
        }))).not.toContain('inline-ad')
    })
})

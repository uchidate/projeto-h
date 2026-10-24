import { describe, expect, it } from 'vitest'
import { uriDoEmbed } from './spotifyIframeApi'

describe('uriDoEmbed', () => {
    it('converte embed de faixa e de álbum em URI', () => {
        expect(uriDoEmbed('https://open.spotify.com/embed/track/06c1p8O0RF26U0jSGJ7Rbc')).toBe('spotify:track:06c1p8O0RF26U0jSGJ7Rbc')
        expect(uriDoEmbed('https://open.spotify.com/embed/album/5VIt2dA2StboE900mllWdJ?utm_source=oembed')).toBe('spotify:album:5VIt2dA2StboE900mllWdJ')
    })
    it('ignora o que não é embed do Spotify', () => {
        expect(uriDoEmbed('https://www.youtube-nocookie.com/embed/abc')).toBeNull()
    })
})

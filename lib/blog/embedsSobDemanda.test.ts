import { describe, expect, it } from 'vitest'
import { adiarEmbedsSpotify } from './embedsSobDemanda'

describe('adiarEmbedsSpotify', () => {
    it('troca src por data-src só nos iframes do Spotify', () => {
        const html = '<iframe src="https://open.spotify.com/embed/track/abc" width="100%" loading="lazy"></iframe><iframe src="https://www.youtube-nocookie.com/embed/xyz"></iframe>'
        const r = adiarEmbedsSpotify(html)
        expect(r).toContain('<iframe data-src="https://open.spotify.com/embed/track/abc" width="100%" loading="lazy">')
        expect(r).toContain('<iframe src="https://www.youtube-nocookie.com/embed/xyz">')
    })

    it('não mexe em texto que apenas cita a URL', () => {
        const html = '<p>Veja https://open.spotify.com/embed/track/abc</p>'
        expect(adiarEmbedsSpotify(html)).toBe(html)
    })
})

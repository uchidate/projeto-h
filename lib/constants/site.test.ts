import { describe, it, expect } from 'vitest'
import { buildOgImageUrl, baseOG, baseTwitter, SITE_URL, SITE_NAME, OG_IMAGE } from './site'

describe('buildOgImageUrl', () => {
    it('inclui apenas o title quando nenhum campo opcional é passado', () => {
        const url = buildOgImageUrl({ title: 'Meu Título' })
        expect(url).toBe(`${SITE_URL}/api/og?${new URLSearchParams({ title: 'Meu Título' }).toString()}`)
    })

    it('inclui subtitle, image e type quando fornecidos', () => {
        const url = buildOgImageUrl({ title: 'X', subtitle: 'Sub', image: 'https://x.com/img.jpg', type: 'artist' })
        expect(url).toContain('subtitle=Sub')
        expect(url).toContain(`image=${encodeURIComponent('https://x.com/img.jpg')}`)
        expect(url).toContain('type=artist')
    })

    it('não inclui subtitle/image/type quando omitidos (undefined)', () => {
        const url = buildOgImageUrl({ title: 'X' })
        expect(url).not.toContain('subtitle=')
        expect(url).not.toContain('image=')
        expect(url).not.toContain('type=')
    })
})

describe('baseOG', () => {
    it('monta o objeto OG com siteName, type website e a imagem padrão', () => {
        const og = baseOG('https://x.com/pagina')
        expect(og).toEqual({
            siteName: SITE_NAME,
            type: 'website',
            url: 'https://x.com/pagina',
            images: [OG_IMAGE],
        })
    })
})

describe('baseTwitter', () => {
    it('monta o card summary_large_image com a imagem padrão', () => {
        expect(baseTwitter()).toEqual({
            card: 'summary_large_image',
            images: [OG_IMAGE.url],
        })
    })
})

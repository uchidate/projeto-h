import { describe, it, expect } from 'vitest'
import { secaoFoiRemovida } from './secoes-removidas'

describe('secaoFoiRemovida', () => {
    it('pega /news e o que vem abaixo, com ou sem idioma', () => {
        for (const url of ['/news', '/news/', '/news/cmmlwt1na229w01mk9cqff2t2', '/en/news/abc', '/pt/news',
            '/admin', '/admin/productions/cmm18hw3j021j29ntvnbn1cij', '/en/admin/artists/x']) {
            expect(secaoFoiRemovida(url)).toBe(true)
        }
    })

    it('não atinge páginas vivas que só parecem com news', () => {
        // O risco real é falso positivo: 410 numa página viva a tira do índice.
        for (const url of ['/', '/newsletter', '/blog/news', '/sitemap-news.xml', '/artists/news-anchor', '/newsroom', '/feed', '/administracao', '/blog/admin']) {
            expect(secaoFoiRemovida(url)).toBe(false)
        }
    })
})

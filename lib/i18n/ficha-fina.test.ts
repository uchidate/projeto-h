import { describe, expect, it } from 'vitest'
import { fichaFina } from './ficha-fina'

const secao = '<div class="hh-secao"><h2>On HallyuHub</h2><p>Cast member of <a href="/productions/x">X</a> (2016).</p></div>'

describe('fichaFina', () => {
    it('uma frase solta mais a lista de produções é fina', () => {
        const html = `<!-- wp:core/paragraph -->\n<p>Formerly used Kang Dong-ho stage name, now using Kim Dong-ho stage name.</p>\n<!-- /wp:core/paragraph -->\n\n${secao}`
        expect(fichaFina(html)).toBe(true)
    })
    it('texto corrido de verdade não é fino', () => {
        expect(fichaFina(`<p>${'Lee Jin-ki debuted as the leader of SHINee. '.repeat(8)}</p>${secao}`)).toBe(false)
    })
    it('a seção de produções não conta como texto', () => {
        expect(fichaFina(secao.repeat(20))).toBe(true)
    })
})

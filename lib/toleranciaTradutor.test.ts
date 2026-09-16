// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { instalarToleranciaTradutor } from './toleranciaTradutor'

describe('instalarToleranciaTradutor', () => {
    beforeAll(() => {
        instalarToleranciaTradutor()
    })

    it('instala uma vez só', () => {
        expect(instalarToleranciaTradutor()).toBe(false)
    })

    it('removeChild de nó que o tradutor já moveu não lança (Sentry PHP-3)', () => {
        const pai = document.createElement('p')
        const texto = document.createTextNode('Idade')
        pai.appendChild(texto)
        // O que o tradutor faz: embrulha o texto em <font> fora do React.
        const font = document.createElement('font')
        pai.replaceChild(font, texto)
        font.appendChild(texto)

        expect(() => pai.removeChild(texto)).not.toThrow()
        expect(font.contains(texto)).toBe(true)
    })

    it('insertBefore com referência movida não lança', () => {
        const pai = document.createElement('div')
        const referencia = document.createElement('span')
        pai.appendChild(referencia)
        document.createElement('font').appendChild(referencia)
        expect(() => pai.insertBefore(document.createElement('b'), referencia)).not.toThrow()
    })

    it('continua funcionando normalmente no caso comum', () => {
        const pai = document.createElement('ul')
        const a = pai.appendChild(document.createElement('li'))
        const b = document.createElement('li')
        pai.insertBefore(b, a)
        expect(pai.firstChild).toBe(b)
        pai.removeChild(a)
        expect(pai.childNodes).toHaveLength(1)
        pai.insertBefore(document.createElement('li'), null)
        expect(pai.childNodes).toHaveLength(2)
    })
})

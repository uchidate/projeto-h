import { describe, expect, it } from 'vitest'
import { tituloNoIdioma } from './titulo-no-idioma'

describe('tituloNoIdioma', () => {
    it('em português devolve o título como veio', () => {
        expect(tituloNoIdioma('production', 'a-ultima-princesa', 'A Última Princesa', 'pt')).toBe('A Última Princesa')
    })
    it('usa o título em inglês quando a obra não tem ficha no idioma', () => {
        expect(tituloNoIdioma('production', 'a-ultima-princesa', 'A Última Princesa', 'ja')).toBe('The Last Princess')
    })
    it('usa o título do idioma quando existe', () => {
        expect(tituloNoIdioma('production', 'escandalo-e-intriga', 'Escândalo e Intriga', 'ja')).toBe('The Scandal')
    })
    it('slug desconhecido mantém o renderizado', () => {
        expect(tituloNoIdioma('production', 'nao-existe', 'Título', 'ja')).toBe('Título')
    })
})

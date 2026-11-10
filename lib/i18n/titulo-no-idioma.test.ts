import { describe, expect, it } from 'vitest'
import { tituloNoIdioma } from './titulo-no-idioma'

describe('tituloNoIdioma', () => {
    it('em português devolve o título como veio', () => {
        expect(tituloNoIdioma('production', 'a-ultima-princesa', 'A Última Princesa', 'pt')).toBe('A Última Princesa')
    })
    it('usa o título que a obra tem no país do idioma', () => {
        expect(tituloNoIdioma('production', 'pousando-no-amor', 'Pousando no Amor', 'ja')).toBe('愛の不時着')
        expect(tituloNoIdioma('production', 'escandalo-e-intriga', 'Escândalo e Intriga', 'ja')).toBe('スキャンダル')
    })
    it('sem título no país, cai para o inglês', () => {
        expect(tituloNoIdioma('production', 'tarot-sete-historias', 'Tarot: Sete Histórias', 'ja')).toBe('Tarot')
    })
    it('slug desconhecido mantém o renderizado', () => {
        expect(tituloNoIdioma('production', 'nao-existe', 'Título', 'ja')).toBe('Título')
    })
})

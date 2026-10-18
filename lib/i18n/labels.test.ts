import { describe, expect, it } from 'vitest'
import { labelsFor } from './labels'

describe('labelsFor().role com sexo cadastrado', () => {
    const pt = labelsFor('pt')

    it('usa a forma feminina e a masculina', () => {
        expect(pt.role('singer', 'female')).toBe('Cantora')
        expect(pt.role('singer', 'male')).toBe('Cantor')
        expect(pt.role('actor', 'female')).toBe('Atriz')
        expect(pt.role('actor', 'male')).toBe('Ator')
        expect(pt.role('dancer', 'female')).toBe('Dançarina')
        expect(pt.role('host', 'male')).toBe('Apresentador')
    })

    it('sem sexo cai na forma neutra', () => {
        expect(pt.role('singer')).toBe('Cantor(a)')
        expect(pt.role('actor', null)).toBe('Ator/Atriz')
        expect(pt.role('actor', '')).toBe('Ator/Atriz')
    })

    it('papéis que não variam seguem iguais, com ou sem sexo', () => {
        expect(pt.role('idol', 'female')).toBe('Idol')
        expect(pt.role('rapper', 'male')).toBe('Rapper')
        expect(pt.role('model', 'female')).toBe('Modelo')
    })

    it('papel desconhecido volta como veio', () => {
        expect(pt.role('xyz', 'female')).toBe('xyz')
    })

    it('ignora o índice que .map(labels.role) passa como 2º argumento', () => {
        expect(['singer', 'actor'].map(pt.role)).toEqual(['Cantor(a)', 'Ator/Atriz'])
    })

    it('em inglês as formas por sexo coincidem com a neutra', () => {
        const en = labelsFor('en')
        expect(en.role('actor', 'female')).toBe('Actor')
        expect(en.role('singer', 'male')).toBe('Singer')
    })
})

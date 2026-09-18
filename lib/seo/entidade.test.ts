import { describe, expect, it } from 'vitest'
import { alturaSchema, generoSchema, juntarSameAs, urlWikipedia } from './entidade'

describe('urlWikipedia', () => {
    it('usa o título resolvido, com espaço virando sublinhado', () => {
        expect(urlWikipedia('Kara (South Korean group)')).toBe('https://en.wikipedia.org/wiki/Kara_(South_Korean_group)')
    })

    it('sem título, usa o link da fonte citada no texto', () => {
        const html = '<p>Texto. <a href="https://en.wikipedia.org/wiki/P.O" target="_blank">Fonte</a></p>'
        expect(urlWikipedia(undefined, html)).toBe('https://en.wikipedia.org/wiki/P.O')
    })

    it('não inventa quando não há nada', () => {
        expect(urlWikipedia('', '<p>sem fonte</p>')).toBeUndefined()
    })
})

describe('generoSchema e alturaSchema', () => {
    it('só aceita os dois valores registrados', () => {
        expect(generoSchema('female')).toBe('https://schema.org/Female')
        expect(generoSchema('outro')).toBeUndefined()
    })

    it('descarta altura fora de faixa plausível', () => {
        expect(alturaSchema(166)).toEqual({ '@type': 'QuantitativeValue', value: 166, unitCode: 'CMT' })
        expect(alturaSchema(0)).toBeUndefined()
        expect(alturaSchema('abc')).toBeUndefined()
    })
})

describe('juntarSameAs', () => {
    it('remove repetidos e vazios', () => {
        expect(juntarSameAs(['a', undefined], ['a', 'b'])).toEqual(['a', 'b'])
        expect(juntarSameAs([], [undefined])).toBeUndefined()
    })
})

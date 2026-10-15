import { describe, it, expect } from 'vitest'
import { tituloQuaseIgual } from './tituloQuaseIgual'

describe('tituloQuaseIgual', () => {
    it('gêmeos do mesmo fato', () => {
        expect(tituloQuaseIgual(
            'NCT 127 lança “Blingy” e abre em Seul a turnê “Neo City – The Redline”',
            'NCT 127 lança BLINGY, sétimo álbum, e abre a turnê NEO CITY – THE REDLINE',
        )).toBe(true)
    })
    it('mesmo grupo, assunto diferente', () => {
        expect(tituloQuaseIgual(
            'NCT 127 lança “Blingy” e abre em Seul a turnê “Neo City – The Redline”',
            'NCT Dream confirma show extra em São Paulo com ingressos à venda',
        )).toBe(false)
    })
    it('título curto demais não decide', () => {
        expect(tituloQuaseIgual('BTS volta', 'BTS volta ao Brasil em 2027')).toBe(false)
    })
})

import { describe, it, expect } from 'vitest'
import { toRgba } from './color'

describe('toRgba', () => {
    it('converte hex de 6 dígitos', () => {
        expect(toRgba('#e91e8c', 0.4)).toBe('rgba(233,30,140,0.4)')
    })

    it('aceita hex sem cerquilha', () => {
        expect(toRgba('e91e8c', 1)).toBe('rgba(233,30,140,1)')
    })

    // O motivo de unificar: a versão que existia em 11 componentes fazia
    // slice(0,2)/slice(2,4)/slice(4,6) sobre 3 dígitos e devolvia
    // rgba(NaN,NaN,NaN,α) — declaração CSS inválida, a cor sumia.
    it('expande hex de 3 dígitos em vez de gerar NaN', () => {
        expect(toRgba('#fff', 0.5)).toBe('rgba(255,255,255,0.5)')
        expect(toRgba('#f0a', 1)).toBe('rgba(255,0,170,1)')
    })

    it('cai para o acento padrão com entrada inválida', () => {
        expect(toRgba('não-é-cor', 0.3)).toBe('rgba(233,30,140,0.3)')
        expect(toRgba('', 0.3)).toBe('rgba(233,30,140,0.3)')
    })

    it('preserva o alpha como recebido', () => {
        expect(toRgba('#000000', 0.08)).toBe('rgba(0,0,0,0.08)')
    })
})

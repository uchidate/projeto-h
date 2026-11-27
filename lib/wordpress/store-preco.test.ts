import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calcularDesconto, ehMenorPrecoEmDias, parsePrecoBR, quedaDePreco } from './store'

const dia = (n: number, preco: string) => ({ date: new Date(Date.UTC(2026, 9, 20) - n * 86400000).toISOString().slice(0, 10), price: preco })

describe('parsePrecoBR', () => {
    it.each([
        ['R$ 1.234,56', 1234.56],
        ['R$ 89,90', 89.9],
        ['49', 49],
        ['R$ 1.000', 1000],
    ])('%s vira %d', (texto, esperado) => {
        expect(parsePrecoBR(texto)).toBe(esperado)
    })

    it('vazio, nulo e texto sem número dão NaN', () => {
        expect(parsePrecoBR('')).toBeNaN()
        expect(parsePrecoBR(null)).toBeNaN()
        expect(parsePrecoBR(undefined)).toBeNaN()
        expect(parsePrecoBR('sob consulta')).toBeNaN()
    })

    it('preço sem dígitos não gera desconto de 100%', () => {
        expect(calcularDesconto('sob consulta', 'R$ 100,00')).toBeNull()
    })
})

describe('preço no histórico', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(Date.UTC(2026, 9, 20, 12))) })
    afterEach(() => vi.useRealTimers())

    it('preço parado não é queda nem menor preço', () => {
        const h = [dia(5, 'R$ 100,00'), dia(2, 'R$ 100,00'), dia(0, 'R$ 100,00')]
        expect(quedaDePreco('R$ 100,00', h)).toBeNull()
        expect(ehMenorPrecoEmDias('R$ 100,00', h)).toBe(false)
    })
    it('queda real devolve o maior valor e o percentual', () => {
        const h = [dia(25, 'R$ 289,00'), dia(0, 'R$ 149,00')]
        expect(quedaDePreco('R$ 149,00', h)).toEqual({ de: 289, percentual: 48 })
        expect(ehMenorPrecoEmDias('R$ 149,00', h)).toBe(true)
    })
    it('oscilação pequena não conta como queda', () => {
        const h = [dia(3, 'R$ 100,00'), dia(0, 'R$ 98,00')]
        expect(quedaDePreco('R$ 98,00', h)).toBeNull()
    })
    it('preço que subiu depois não é menor preço', () => {
        const h = [dia(10, 'R$ 100,00'), dia(0, 'R$ 120,00')]
        expect(quedaDePreco('R$ 120,00', h)).toBeNull()
        expect(ehMenorPrecoEmDias('R$ 120,00', h)).toBe(false)
    })
    it('leituras fora da janela são ignoradas', () => {
        const h = [dia(60, 'R$ 300,00'), dia(0, 'R$ 100,00')]
        expect(quedaDePreco('R$ 100,00', h)).toBeNull()
    })
})

import { describe, expect, it } from 'vitest'
import { variantePorId } from './experimento'

describe('variantePorId', () => {
    it('id par é a variante nova (b), ímpar é a atual (a)', () => {
        expect(variantePorId(20510)).toBe('b')
        expect(variantePorId(20511)).toBe('a')
    })
    it('é estável: o mesmo id cai sempre no mesmo braço', () => {
        expect(variantePorId(777)).toBe(variantePorId(777))
    })
    it('divide de forma equilibrada', () => {
        const b = Array.from({ length: 1000 }, (_, i) => variantePorId(i)).filter(v => v === 'b').length
        expect(b).toBe(500)
    })
})

import { describe, expect, it } from 'vitest'
import { variantePorId } from './experimento'

describe('variantePorId', () => {
    it('teste A/B encerrado: sempre devolve a variante nova (b), qualquer id', () => {
        expect(variantePorId(20510)).toBe('b')
        expect(variantePorId(20511)).toBe('b')
        expect(variantePorId(0)).toBe('b')
        expect(variantePorId(777)).toBe('b')
    })
})

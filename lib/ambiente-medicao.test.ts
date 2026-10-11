import { describe, expect, it } from 'vitest'
import { medicaoPermitida } from './ambiente-medicao'

describe('medicaoPermitida', () => {
    it('só produção mede', () => {
        expect(medicaoPermitida('www.example.com')).toBe(true)
        expect(medicaoPermitida('example.com')).toBe(true)
    })

    it('staging não mede', () => {
        expect(medicaoPermitida('staging.example.com')).toBe(false)
        expect(medicaoPermitida('STAGING.example.com')).toBe(false)
    })

    it('desenvolvimento local não mede', () => {
        expect(medicaoPermitida('localhost')).toBe(false)
        expect(medicaoPermitida('127.0.0.1')).toBe(false)
        expect(medicaoPermitida('maquina.local')).toBe(false)
    })
})

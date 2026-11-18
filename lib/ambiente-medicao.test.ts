import { describe, expect, it } from 'vitest'
import { CHAVE_SEM_MEDICAO, aparelhoSemMedicao, medicaoPermitida } from './ambiente-medicao'

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

function armazenamentoFalso() {
    const m = new Map<string, string>()
    return {
        m,
        getItem: (k: string) => m.get(k) ?? null,
        setItem: (k: string, v: string) => void m.set(k, v),
        removeItem: (k: string) => void m.delete(k),
    }
}

describe('aparelhoSemMedicao (modo dono)', () => {
    it('?hh-teste=1 marca o aparelho e a marca vale nas páginas seguintes', () => {
        const a = armazenamentoFalso()
        expect(aparelhoSemMedicao('?hh-teste=1', a)).toBe(true)
        expect(a.m.get(CHAVE_SEM_MEDICAO)).toBe('1')
        expect(a.m.get('umami.disabled')).toBe('1')
        expect(aparelhoSemMedicao('', a)).toBe(true)
        expect(aparelhoSemMedicao('?utm_source=x', a)).toBe(true)
    })

    it('?hh-teste=0 desfaz a marca', () => {
        const a = armazenamentoFalso()
        aparelhoSemMedicao('?hh-teste=1', a)
        expect(aparelhoSemMedicao('?hh-teste=0', a)).toBe(false)
        expect(a.m.size).toBe(0)
        expect(aparelhoSemMedicao('', a)).toBe(false)
    })

    it('visitante comum segue medido', () => {
        expect(aparelhoSemMedicao('', armazenamentoFalso())).toBe(false)
        expect(aparelhoSemMedicao('?hh-teste=talvez', armazenamentoFalso())).toBe(false)
    })

    it('sem storage, vale só o pedido da própria URL', () => {
        expect(aparelhoSemMedicao('?hh-teste=1', null)).toBe(true)
        expect(aparelhoSemMedicao('', null)).toBe(false)
        const quebrado = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') }, removeItem: () => {} }
        expect(aparelhoSemMedicao('?hh-teste=1', quebrado)).toBe(true)
        expect(aparelhoSemMedicao('', quebrado)).toBe(false)
    })
})

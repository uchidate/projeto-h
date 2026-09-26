// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { classeDaVisita } from './visita'

const D = (s: string) => new Date(`${s}T12:00:00Z`).getTime()

describe('classeDaVisita', () => {
    beforeEach(() => window.localStorage.clear())

    it('primeira visita é "novo" e grava o dia', () => {
        expect(classeDaVisita(D('2026-09-26'))).toBe('novo')
        expect(window.localStorage.getItem('hh-primeira-visita-v1')).toBe('2026-09-26')
    })

    it('voltar no mesmo dia continua "novo"', () => {
        classeDaVisita(D('2026-09-26'))
        expect(classeDaVisita(D('2026-09-26'))).toBe('novo')
    })

    it('abrir em outro dia é "voltou", e o dia original não é sobrescrito', () => {
        classeDaVisita(D('2026-09-26'))
        expect(classeDaVisita(D('2026-09-27'))).toBe('voltou')
        expect(window.localStorage.getItem('hh-primeira-visita-v1')).toBe('2026-09-26')
    })

    it('valor corrompido no navegador é ignorado e regravado', () => {
        window.localStorage.setItem('hh-primeira-visita-v1', 'lixo')
        expect(classeDaVisita(D('2026-09-26'))).toBe('novo')
        expect(window.localStorage.getItem('hh-primeira-visita-v1')).toBe('2026-09-26')
    })
})

import { describe, expect, it } from 'vitest'
import { dataRelativa } from './data-relativa'

const agora = new Date('2026-10-24T15:00:00Z')

describe('dataRelativa', () => {
    it('hoje e ontem, pelo dia de Brasília', () => {
        expect(dataRelativa('2026-10-24T09:00:00', 'pt', agora)).toBe('hoje')
        expect(dataRelativa('2026-10-23T09:00:00', 'pt', agora)).toBe('ontem')
        expect(dataRelativa('2026-10-23T09:00:00', 'en', agora)).toBe('yesterday')
    })
    // A data do WordPress vem no horário de São Paulo, sem fuso: lida como UTC, a madrugada recuava um dia.
    it('publicado de madrugada continua no mesmo dia', () => {
        expect(dataRelativa('2026-10-24T01:00:00', 'pt', agora)).toBe('hoje')
        expect(dataRelativa('2026-10-20T00:30:00', 'pt', agora)).toBe('20/10')
    })
    it('data com fuso e data sem hora são respeitadas', () => {
        expect(dataRelativa('2026-10-24T02:00:00Z', 'pt', agora)).toBe('ontem')
        expect(dataRelativa('2026-10-24', 'pt', agora)).toBe('hoje')
    })
    it('mais antigo vira dd/mm', () => {
        expect(dataRelativa('2026-10-20T09:00:00', 'pt', agora)).toBe('20/10')
    })
})

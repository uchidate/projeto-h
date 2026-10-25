import { describe, expect, it } from 'vitest'
import { dataRelativa } from './data-relativa'

const agora = new Date('2026-10-24T15:00:00Z')

describe('dataRelativa', () => {
    it('hoje e ontem, pelo dia de Brasília', () => {
        expect(dataRelativa('2026-10-24T09:00:00', 'pt', agora)).toBe('hoje')
        expect(dataRelativa('2026-10-23T09:00:00', 'pt', agora)).toBe('ontem')
        expect(dataRelativa('2026-10-23T09:00:00', 'en', agora)).toBe('yesterday')
    })
    it('mais antigo vira dd/mm', () => {
        expect(dataRelativa('2026-10-20T09:00:00', 'pt', agora)).toBe('20/10')
    })
})

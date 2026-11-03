import { describe, it, expect } from 'vitest'
import { instanteDoPost, tempoRelativoPt } from './tempoRelativo'

// 19:06 em São Paulo = 22:06 UTC
const post = '2026-11-03T19:06:31'
const em = (iso: string) => new Date(iso)

describe('instanteDoPost', () => {
    it('lê a data sem fuso como horário de São Paulo', () => {
        expect(instanteDoPost(post).toISOString()).toBe('2026-11-03T22:06:31.000Z')
    })
    it('respeita um fuso explícito', () => {
        expect(instanteDoPost('2026-11-03T22:06:31Z').toISOString()).toBe('2026-11-03T22:06:31.000Z')
    })
})

describe('tempoRelativoPt', () => {
    it('minutos, horas e ontem', () => {
        expect(tempoRelativoPt(post, em('2026-11-03T22:06:50Z'))).toBe('agora')
        expect(tempoRelativoPt(post, em('2026-11-03T22:46:31Z'))).toBe('há 40 min')
        expect(tempoRelativoPt(post, em('2026-11-04T03:06:31Z'))).toBe('há 5 h')
        expect(tempoRelativoPt(post, em('2026-11-04T23:00:00Z'))).toBe('ontem')
    })
    it('a partir de 48 h mostra a data', () => {
        expect(tempoRelativoPt(post, em('2026-11-06T00:00:00Z'))).toMatch(/nov/i)
    })
    it('data no futuro (relógio adiantado) cai para a data, sem "há -1 h"', () => {
        expect(tempoRelativoPt(post, em('2026-11-03T20:00:00Z'))).toMatch(/nov/i)
    })
})

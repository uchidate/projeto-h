// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const consent = vi.hoisted(() => ({ pode: true, recusou: false }))
vi.mock('@/lib/consent', () => ({ podeGuardarHistorico: () => consent.pode, recusouConsentimento: () => consent.recusou }))

import { EMPTY_STATS, loadStats, saveStats } from './stats'

const guardado = { ...EMPTY_STATS, totalGames: 3 }

describe('estatísticas do quiz e consentimento', () => {
    beforeEach(() => { localStorage.clear(); consent.pode = true; consent.recusou = false })

    it('guarda e lê com permissão', () => {
        saveStats(guardado)
        expect(loadStats().totalGames).toBe(3)
    })
    it('não guarda sem permissão', () => {
        consent.pode = false
        saveStats(guardado)
        expect(localStorage.getItem('oc_quiz_stats')).toBeNull()
    })
    it('quem recusa perde o que já estava guardado e começa do zero', () => {
        saveStats(guardado)
        consent.pode = false; consent.recusou = true
        expect(loadStats().totalGames).toBe(0)
        expect(localStorage.getItem('oc_quiz_stats')).toBeNull()
    })
})

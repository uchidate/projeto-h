import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __reiniciarRankingRemoto, garantirRankingRemoto, parseRanking, rankingRemoto } from './ranking-remoto'

describe('parseRanking', () => {
    it('aceita o formato publicado pelo servidor', () => {
        expect(parseRanking({ neutro: 3, global: { '1': 5 }, porContexto: { loja: { '1': 4 } } }))
            .toEqual({ neutro: 3, global: { '1': 5 }, porContexto: { loja: { '1': 4 } } })
    })
    it('sem neutro ou contexto usa padrões; sem global rejeita', () => {
        expect(parseRanking({ global: {} })).toEqual({ neutro: 0, global: {}, porContexto: {} })
        expect(parseRanking({ neutro: 3 })).toBeNull()
        expect(parseRanking([])).toBeNull()
        expect(parseRanking(null)).toBeNull()
    })
})

describe('garantirRankingRemoto', () => {
    beforeEach(() => __reiniciarRankingRemoto())
    afterEach(() => vi.unstubAllGlobals())

    it('carrega o ranking quando o arquivo é válido', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ neutro: 3, global: { '9': 7 }, porContexto: {} }) }))
        await garantirRankingRemoto()
        expect(rankingRemoto()?.global['9']).toBe(7)
    })
    it('resposta inválida ou erro de rede mantém o ranking vazio, sem lançar', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
        await expect(garantirRankingRemoto()).resolves.toBeUndefined()
        expect(rankingRemoto()).toBeNull()
        __reiniciarRankingRemoto()
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')))
        await expect(garantirRankingRemoto()).resolves.toBeUndefined()
        expect(rankingRemoto()).toBeNull()
    })
    it('falha depois de um sucesso mantém o último ranking', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ global: { '1': 2 } }) }))
        await garantirRankingRemoto()
        vi.useFakeTimers()
        vi.setSystemTime(Date.now() + 11 * 60 * 1000) // passa da validade: a próxima chamada tenta ler de novo
        const falha = vi.fn().mockRejectedValue(new Error('rede'))
        vi.stubGlobal('fetch', falha)
        await garantirRankingRemoto()
        vi.useRealTimers()
        expect(falha).toHaveBeenCalledTimes(1)
        expect(rankingRemoto()?.global['1']).toBe(2)
    })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRateLimiter } from './rateLimit'

afterEach(() => vi.useRealTimers())

describe('createRateLimiter', () => {
    it('libera até o teto e bloqueia a partir dele', () => {
        const limiter = createRateLimiter({ max: 3, windowMs: 1000 })
        expect([1, 2, 3].map(() => limiter.check('ip'))).toEqual([false, false, false])
        expect(limiter.check('ip')).toBe(true)
    })

    it('conta cada chave separadamente', () => {
        const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
        limiter.check('a')
        expect(limiter.check('a')).toBe(true)
        expect(limiter.check('b')).toBe(false)
    })

    it('libera de novo quando a janela passa', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))
        const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
        limiter.check('ip')
        expect(limiter.check('ip')).toBe(true)

        vi.setSystemTime(new Date('2026-08-05T12:00:02Z'))
        expect(limiter.check('ip')).toBe(false)
    })

    // Regressão: a versão anterior, inline no /api/report, filtrava por chave
    // mas nunca removia chave nenhuma — todo IP já visto ficava até o restart.
    it('descarta chaves vencidas em vez de acumular até o restart', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))
        const limiter = createRateLimiter({ max: 5, windowMs: 1000 })
        for (let i = 0; i < 500; i++) limiter.check(`ip-${i}`)
        expect(limiter.size()).toBe(500)

        vi.setSystemTime(new Date('2026-08-05T12:00:05Z'))
        limiter.check('ip-nova')

        expect(limiter.size()).toBe(1)
    })
})

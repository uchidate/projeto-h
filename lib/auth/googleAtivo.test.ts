import { afterEach, describe, expect, it, vi } from 'vitest'
import { googleAtivo } from './googleAtivo'

describe('googleAtivo', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('só liga com ID e segredo', () => {
        vi.stubEnv('GOOGLE_CLIENT_ID', 'id')
        vi.stubEnv('GOOGLE_CLIENT_SECRET', '')
        expect(googleAtivo()).toBe(false)
        vi.stubEnv('GOOGLE_CLIENT_SECRET', 'segredo')
        expect(googleAtivo()).toBe(true)
    })

    // O defeito de 2026-09-13: o valor era calculado uma vez e congelava. Este
    // teste garante que a leitura acompanha o ambiente a cada chamada.
    it('reflete o ambiente no momento da chamada, não na importação', () => {
        vi.stubEnv('GOOGLE_CLIENT_ID', '')
        vi.stubEnv('GOOGLE_CLIENT_SECRET', '')
        expect(googleAtivo()).toBe(false)
        vi.stubEnv('GOOGLE_CLIENT_ID', 'id')
        vi.stubEnv('GOOGLE_CLIENT_SECRET', 'segredo')
        expect(googleAtivo()).toBe(true)
    })
})

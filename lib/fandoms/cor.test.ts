import { describe, expect, it } from 'vitest'
import { contorno, luminancia, tinta } from './cor'

describe('cores das torcidas', () => {
    it('usa tinta escura sobre cor clara e branca sobre cor escura', () => {
        expect(tinta('#ffe14d')).toBe('#15102b')
        expect(tinta('#3a1c71')).toBe('#ffffff')
    })
    it('só contorna cores quase pretas', () => {
        expect(contorno('#000000')).toContain('outline')
        expect(contorno('#ff5fa2')).toBe('')
    })
    it('cor inválida vira neutra clara, sem quebrar', () => {
        expect(luminancia('vermelho')).toBeGreaterThan(0.5)
    })
})

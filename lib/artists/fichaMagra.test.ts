import { describe, it, expect } from 'vitest'
import { fichaMagra } from './fichaMagra'

describe('fichaMagra', () => {
    it('é magra sem capítulos, análise, obras e com bio curta', () => {
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 0, bioChars: 120 })).toBe(true)
    })
    it('deixa de ser magra com qualquer conteúdo próprio', () => {
        expect(fichaMagra({ hasStoryChapters: true, hasAnalysis: false, productions: 0, bioChars: 120 })).toBe(false)
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 1, bioChars: 120 })).toBe(false)
        expect(fichaMagra({ hasStoryChapters: false, hasAnalysis: false, productions: 0, bioChars: 900 })).toBe(false)
    })
})

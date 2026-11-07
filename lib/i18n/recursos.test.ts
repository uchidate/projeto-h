import { describe, expect, it } from 'vitest'
import { temRecurso } from './recursos'

describe('temRecurso', () => {
    it('loja, quiz e streaming do Brasil só existem em português', () => {
        for (const recurso of ['loja', 'quiz', 'streamingBrasil'] as const) {
            expect(temRecurso(recurso, 'pt')).toBe(true)
            expect(temRecurso(recurso, 'en')).toBe(false)
        }
    })
})

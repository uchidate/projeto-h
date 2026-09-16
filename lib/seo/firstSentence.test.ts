import { describe, expect, it } from 'vitest'
import { firstSentence } from './firstSentence'

describe('firstSentence', () => {
    it('devolve a primeira frase completa', () => {
        expect(firstSentence('MEOVV é um girl group sul-coreano formado pela The Black Label. Estreou em 2024.'))
            .toBe('MEOVV é um girl group sul-coreano formado pela The Black Label.')
    })

    it('ignora frase curta demais e junta espaços', () => {
        expect(firstSentence('Oi.  Tudo bem?')).toBeNull()
        expect(firstSentence('  Kazuha   nasceu em Kochi, no Japão, e chegou ao k-pop pelo balé clássico. Depois...'))
            .toBe('Kazuha nasceu em Kochi, no Japão, e chegou ao k-pop pelo balé clássico.')
    })

    it('devolve null sem pontuação final ou texto vazio', () => {
        expect(firstSentence('um texto sem ponto final que continua e continua sem terminar nunca')).toBeNull()
        expect(firstSentence('')).toBeNull()
    })
})

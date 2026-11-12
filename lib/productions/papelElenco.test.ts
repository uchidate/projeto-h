import { describe, expect, it } from 'vitest'
import { papelNoIdioma } from './papelElenco'

describe('papelNoIdioma', () => {
    it('traduz papéis genéricos do TMDB', () => {
        expect(papelNoIdioma('Self', 'ja')).toBe('本人')
        expect(papelNoIdioma('Self - Contestant', 'es')).toBe('Concursante')
        expect(papelNoIdioma('Self — Contestant', 'pt')).toBe('Participante')
        expect(papelNoIdioma('himself', 'ja')).toBe('本人')
    })
    it('título + sobrenome mantém o nome', () => {
        expect(papelNoIdioma('Detective Kim', 'ja')).toBe('Kim刑事')
        expect(papelNoIdioma('Mr. Park', 'pt')).toBe('Sr. Park')
    })
    it('nome de personagem passa intacto', () => {
        expect(papelNoIdioma('Lee Do', 'ja')).toBe('Lee Do')
        expect(papelNoIdioma('Protagonista', 'ja')).toBe('Protagonista')
    })
    it('inglês não muda, exceto o "Elenco" em português', () => {
        expect(papelNoIdioma('Self', 'en')).toBe('Self')
        expect(papelNoIdioma('Elenco', 'en')).toBe('Cast')
        expect(papelNoIdioma('Elenco', 'ja')).toBe('出演')
    })
})

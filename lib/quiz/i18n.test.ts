import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { perguntasNoIdioma } from './i18n'

const base = (id: number): QuizQuestion => ({ id, question: 'pt', options: ['a', 'b', 'c', 'd'], correct: 2, explanation: 'pt', category: 'cultura', difficulty: 'easy', relatedHref: '/blog/x', relatedLabel: 'x' })
const acf = { question: 'WP \\"q\\"', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', explanation: 'WP e' }

describe('perguntas do quiz traduzidas', () => {
    it('usa a tradução publicada no WordPress e preserva a resposta certa', () => {
        const [p] = perguntasNoIdioma([{ ...base(1), traducoes: { en: { acf } } }], 'en')
        expect(p.question).toBe('WP "q"')
        expect(p.options).toEqual(['A', 'B', 'C', 'D'])
        expect(p.explanation).toBe('WP e')
        expect(p.correct).toBe(2)
        expect(p.relatedHref).toBeNull()
        expect(p.traducoes).toBeUndefined()
    })

    it('mantém só as perguntas com tradução no idioma', () => {
        const lista = [{ ...base(1), traducoes: { ja: { acf } } }, base(2)]
        expect(perguntasNoIdioma(lista, 'ja').map((p) => p.id)).toEqual([1])
        expect(perguntasNoIdioma(lista, 'en')).toEqual([])
    })

    it('tradução desatualizada ou incompleta tira a pergunta do idioma', () => {
        expect(perguntasNoIdioma([{ ...base(1), traducoes: { en: { stale: true, acf } } }], 'en')).toEqual([])
        expect(perguntasNoIdioma([{ ...base(1), traducoes: { en: { acf: { question: 'q', option_a: 'a' } } } }], 'en')).toEqual([])
    })

    it('em português devolve a lista sem mexer', () => {
        const lista = [base(1)]
        expect(perguntasNoIdioma(lista, 'pt')).toBe(lista)
    })
})

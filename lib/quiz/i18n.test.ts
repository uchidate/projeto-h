import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { perguntasNoIdioma, traducoesDasPerguntas } from './i18n'

const base = (id: number): QuizQuestion => ({ id, question: 'pt', options: ['a', 'b', 'c', 'd'], correct: 2, explanation: 'pt', category: 'cultura', difficulty: 'easy', relatedHref: '/blog/x', relatedLabel: 'x' })

describe('perguntas do quiz traduzidas', () => {
    const traducoes = traducoesDasPerguntas('en')

    it('toda entrada tem pergunta, quatro alternativas distintas e explicação', () => {
        expect(Object.keys(traducoes).length).toBeGreaterThanOrEqual(60)
        for (const [id, t] of Object.entries(traducoes)) {
            expect(Number.isInteger(Number(id)), id).toBe(true)
            expect(t.q.trim(), id).not.toBe('')
            expect(t.e.trim(), id).not.toBe('')
            expect(t.o, id).toHaveLength(4)
            expect(new Set(t.o).size, `${id}: alternativas repetidas`).toBe(4)
            // Texto em português que sobrou: acento típico ou palavra de ligação.
            expect(`${t.q} ${t.o.join(' ')} ${t.e}`, id).not.toMatch(/[ãõç]|\b(qual|foi|uma|dos|das)\b/i)
        }
    })

    it('japonês: toda pergunta tem quatro alternativas distintas, sem português sobrando', () => {
        const ja = traducoesDasPerguntas('ja')
        expect(Object.keys(ja).length).toBeGreaterThanOrEqual(190)
        for (const [id, t] of Object.entries(ja)) {
            expect(t.q.trim(), id).not.toBe('')
            expect(t.e.trim(), id).not.toBe('')
            expect(t.o, id).toHaveLength(4)
            expect(new Set(t.o).size, `${id}: alternativas repetidas`).toBe(4)
            expect(`${t.q} ${t.o.join(' ')} ${t.e}`, id).not.toMatch(/[ãõç]|\b(qual|foi|uma|dos|das)\b/i)
        }
    })

    it('espanhol: mesmas perguntas do inglês, quatro alternativas distintas, sem português sobrando', () => {
        const es = traducoesDasPerguntas('es')
        expect(Object.keys(es).sort()).toEqual(Object.keys(traducoes).sort())
        for (const [id, t] of Object.entries(es)) {
            expect(t.q.trim(), id).not.toBe('')
            expect(t.e.trim(), id).not.toBe('')
            expect(t.o, id).toHaveLength(4)
            expect(new Set(t.o).size, `${id}: alternativas repetidas`).toBe(4)
            // "dos" e "una" existem em espanhol; o que denuncia português é til, "ç" ou "ão".
            expect(`${t.q} ${t.o.join(' ')} ${t.e}`, id).not.toMatch(/[ãõç]|\b(qual|foi|uma|das|não)\b/i)
        }
    })

    it('mantém só as perguntas traduzidas, troca o texto e preserva a resposta certa', () => {
        const id = Number(Object.keys(traducoes)[0])
        const lista = perguntasNoIdioma([base(id), base(1)], 'en')
        expect(lista.map((p) => p.id)).toEqual([id])
        expect(lista[0].question).toBe(traducoes[String(id)].q)
        expect(lista[0].correct).toBe(2)
        expect(lista[0].relatedHref).toBeNull()
    })

    it('a tradução publicada no WordPress vale por cima do JSON', () => {
        const id = Number(Object.keys(traducoes)[0])
        const wp = { acf: { question: 'WP \\"q\\"', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', explanation: 'WP e' } }
        const [p] = perguntasNoIdioma([{ ...base(id), traducoes: { en: wp } }], 'en')
        expect(p.question).toBe('WP "q"')
        expect(p.options).toEqual(['A', 'B', 'C', 'D'])
        expect(p.explanation).toBe('WP e')
        expect(p.correct).toBe(2)
        expect(p.traducoes).toBeUndefined()
    })

    it('pergunta sem JSON mas com tradução no WordPress existe no idioma', () => {
        const wp = { acf: { question: 'q', option_a: 'a', option_b: 'b', option_c: 'c', option_d: 'd', explanation: 'e' } }
        expect(perguntasNoIdioma([{ ...base(1), traducoes: { ja: wp } }], 'ja').map((p) => p.id)).toEqual([1])
        expect(perguntasNoIdioma([{ ...base(1), traducoes: { ja: wp } }], 'en')).toEqual([])
    })

    it('tradução desatualizada ou incompleta no WordPress tira a pergunta do idioma, sem cair no JSON antigo', () => {
        const id = Number(Object.keys(traducoes)[0])
        const stale = { stale: true, acf: { question: 'q', option_a: 'a', option_b: 'b', option_c: 'c', option_d: 'd', explanation: 'e' } }
        expect(perguntasNoIdioma([{ ...base(id), traducoes: { en: stale } }], 'en')).toEqual([])
        expect(perguntasNoIdioma([{ ...base(id), traducoes: { en: { acf: { question: 'q', option_a: 'a' } } } }], 'en')).toEqual([])
    })

    it('em português devolve a lista sem mexer', () => {
        const lista = [base(1)]
        expect(perguntasNoIdioma(lista, 'pt')).toBe(lista)
    })
})

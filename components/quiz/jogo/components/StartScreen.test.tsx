// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import type { QuizStats } from '../lib/stats'
import { StartScreen } from './StartScreen'

vi.mock('next-intl', () => ({
    useTranslations: () => {
        const t = (chave: string, v?: Record<string, unknown>) => (v ? `${chave} ${Object.values(v).join(' ')}` : chave)
        return Object.assign(t, { rich: (chave: string) => chave })
    },
}))
vi.mock('./ScoreHistory', () => ({ ScoreHistory: () => <div>histórico</div> }))

afterEach(cleanup)

const perguntas = (n: number, extra: Partial<QuizQuestion> = {}) =>
    Array.from({ length: n }, () => ({ category: 'k-pop', difficulty: 'medium', ...extra }) as QuizQuestion)

const semJogos = { totalGames: 0, totalQuestions: 0, totalCorrect: 0, scores: [], categoryStats: {} } as unknown as QuizStats

function montar(props: Partial<Parameters<typeof StartScreen>[0]> = {}) {
    const onStart = vi.fn()
    render(<StartScreen onStart={onStart} stats={semJogos} allQuestions={perguntas(20)} {...props} />)
    return onStart
}

const jogar = () => screen.getByRole('button', { name: 'capa.jogar' }) as HTMLButtonElement
const aviso = () => screen.queryByText(/^capa\.soN/)?.textContent ?? null

describe('StartScreen', () => {
    it('começa com tudo misturado em nível médio', () => {
        const onStart = montar()
        fireEvent.click(jogar())
        expect(onStart).toHaveBeenCalledWith('all', 'medium')
    })

    it('leva o tema e o nível escolhidos, pelo botão principal e pelo fixo do celular', () => {
        const onStart = montar()
        fireEvent.click(screen.getByRole('button', { name: /categorias\.k-pop/ }))
        fireEvent.click(screen.getByRole('button', { name: /niveis\.hardcapa\.tempoPts/ }))
        fireEvent.click(jogar())
        fireEvent.click(screen.getByRole('button', { name: /^capa\.jogarNivel/ }))
        expect(onStart.mock.calls).toEqual([['k-pop', 'hard'], ['k-pop', 'hard']])
    })

    it('só mostra os temas que têm perguntas', () => {
        montar({ allQuestions: [...perguntas(3), ...perguntas(2, { category: 'historia' })] })
        expect(screen.getByRole('button', { name: /categorias\.historia/ })).toBeDefined()
        expect(screen.queryByRole('button', { name: /categorias\.k-drama/ })).toBeNull()
    })

    it('sem perguntas, avisa e não deixa jogar', () => {
        montar({ allQuestions: [] })
        expect(screen.getByText('capa.semPerguntas')).toBeDefined()
        expect(jogar().disabled).toBe(true)
    })

    it('avisa quando o nível tem poucas perguntas, e usa o tema todo se tiver menos de cinco', () => {
        montar({ allQuestions: [...perguntas(6), ...perguntas(20, { difficulty: 'hard' })] })
        expect(aviso()).toBe('capa.soN 6')
        cleanup()
        montar({ allQuestions: [...perguntas(2), ...perguntas(20, { difficulty: 'hard' })] })
        expect(aviso()).toBeNull()
    })

    it('no recorte por assunto, conta só as dele e as gerais', () => {
        montar({
            initialCategory: 'k-pop', initialSubcategory: 'grupos',
            allQuestions: [...perguntas(3, { subcategory: 'grupos' }), ...perguntas(3), ...perguntas(20, { subcategory: 'idols' })],
        })
        expect(aviso()).toBe('capa.soN 6')
    })

    it('quem já jogou vê acerto, sequência, melhor placar e histórico', () => {
        montar({
            stats: {
                totalGames: 2, totalQuestions: 20, totalCorrect: 15,
                scores: [{ points: 900, streak: 3 }, { points: 500 }],
                categoryStats: { 'k-pop': { correct: 1, total: 4 } },
            } as unknown as QuizStats,
        })
        expect(screen.getByText('75%')).toBeDefined()
        expect(screen.getByText('🔥 3')).toBeDefined()
        expect(screen.getByText('900')).toBeDefined()
        expect(screen.getByText(/capa\.seu 25/)).toBeDefined()
        expect(screen.getByText('histórico')).toBeDefined()
    })
})

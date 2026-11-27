// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

// Cobre a partida do quiz: pontuação com bônus de tempo e de sequência, tempo esgotado, avanço automático,
// resultado entregue no fim e atalhos de teclado (com o relógio atual, sem roubar teclas do navegador).
const banner = vi.hoisted(() => ({ estado: 'oculto' as 'oculto' | 'perguntar' }))
vi.mock('@/lib/consent', () => ({ getBannerState: () => banner.estado, getServerBannerState: () => 'oculto', subscribeBanner: () => () => {} }))
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) => (values ? `${key}~${JSON.stringify(values)}` : key),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('./QuestionText', () => ({ QuestionText: ({ text }: { text: string }) => <>{text}</> }))

import { QuizScreen } from './QuizScreen'

const pergunta = (id: number, extra: Partial<QuizQuestion> = {}): QuizQuestion => ({
    id, question: `Pergunta ${id}?`, options: ['Um', 'Dois', 'Três', 'Quatro'], correct: 1, explanation: `Porque ${id}.`, category: 'k-pop', difficulty: 'medium', ...extra,
})

const fim = vi.fn()
const montar = (n = 3, perguntas = Array.from({ length: n }, (_, i) => pergunta(i + 1))) =>
    render(<QuizScreen questions={perguntas} difficulty="medium" onFinish={fim} />)
const opcoes = (c: Element) => Array.from(c.querySelectorAll<HTMLButtonElement>('div.grid button'))
const botaoSeguinte = (c: Element) => Array.from(c.querySelectorAll('button')).find((b) => /partida\.(proxima|verResultado)/.test(b.textContent!))!
const clicar = (c: Element, idx: number) => fireEvent.click(opcoes(c)[idx])
const seguir = (c: Element) => fireEvent.click(botaoSeguinte(c))
const tecla = (key: string, extra: Record<string, unknown> = {}, alvo: Element = document.body) => fireEvent.keyDown(alvo, { key, ...extra })
const passar = (segundos: number) => { for (let i = 0; i < segundos; i++) act(() => { vi.advanceTimersByTime(1000) }) }
const pontos = (c: Element) => Number(c.textContent!.match(/([\d.,]+) pts/)![1].replace(/[.,]/g, ''))

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); banner.estado = 'oculto' })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('QuizScreen — pontuação', () => {
    it('acerto imediato vale os pontos do nível mais meio de bônus de tempo', () => {
        const { container } = montar()
        clicar(container, 1)
        expect(pontos(container)).toBe(150)
        expect(container.textContent).toContain('partida.acertou')
        expect(container.textContent).toContain('Porque 1.')
    })

    it('o bônus encolhe conforme o tempo passa', () => {
        const { container } = montar()
        passar(9)
        clicar(container, 1)
        expect(pontos(container)).toBe(120)
    })

    it('erro não pontua e destaca a certa', () => {
        const { container } = montar()
        clicar(container, 0)
        expect(pontos(container)).toBe(0)
        expect(container.textContent).toContain('partida.quase')
        expect(opcoes(container)[1].className).toContain('bg-[#38e1c0]')
        expect(opcoes(container)[0].className).toContain('bg-[#ff5fa2]')
        expect(opcoes(container)[2].className).toContain('opacity-40')
        expect(opcoes(container).every((b) => b.disabled)).toBe(true)
    })

    it('tempo esgotado conta como sem resposta', () => {
        const { container } = montar(1)
        passar(15)
        expect(container.textContent).toContain('partida.tempo')
        seguir(container)
        expect(fim).toHaveBeenCalledWith([null], 0, [15], 0)
    })

    it('a partir do terceiro acerto seguido há bônus de sequência, e o erro zera', () => {
        const { container } = montar(5)
        for (let i = 0; i < 3; i++) { clicar(container, 1); if (i < 2) seguir(container) }
        expect(container.textContent).toContain('partida.bonus~{"n":3,"pts":25}')
        expect(pontos(container)).toBe(475)
        expect(container.textContent).toContain('🔥 3x')
        seguir(container)
        clicar(container, 0)
        expect(container.textContent).not.toContain('🔥')
        expect(container.textContent).not.toContain('partida.bonus')
    })

    it('entrega respostas, pontos, tempos e a melhor sequência no fim', () => {
        const { container } = montar(3)
        clicar(container, 1)
        seguir(container)
        passar(3)
        clicar(container, 1)
        seguir(container)
        clicar(container, 0)
        expect(botaoSeguinte(container).textContent).toContain('partida.verResultado')
        seguir(container)
        expect(fim).toHaveBeenCalledWith([1, 1, 0], 290, [0, 3, 0], 2)
    })

    it('o link de leitura usa o rótulo da pergunta ou o padrão', () => {
        const { container } = montar(1, [pergunta(1, { relatedHref: '/blog/x' })])
        clicar(container, 1)
        expect(container.querySelector('a[href="/blog/x"]')!.textContent).toContain('partida.saibaMais')
    })

    it('sem perguntas, não desenha nada', () => {
        const { container } = montar(0)
        expect(container.innerHTML).toBe('')
    })
})

describe('QuizScreen — avanço automático', () => {
    it('conta 3 segundos e passa sozinho para a próxima', () => {
        const { container } = montar()
        clicar(container, 1)
        expect(botaoSeguinte(container).textContent).toContain('partida.proximaSeg~{"s":3}')
        act(() => { vi.advanceTimersByTime(2500) })
        expect(container.textContent).toContain('partida.perguntaDe~{"n":2,"total":3}')
        expect(container.textContent).toContain('15s')
    })

    it('na última, termina sozinho uma única vez', () => {
        const { container } = montar(1)
        clicar(container, 1)
        act(() => { vi.advanceTimersByTime(6000) })
        expect(fim).toHaveBeenCalledTimes(1)
        expect(fim).toHaveBeenCalledWith([1], 150, [0], 1)
    })

    it('avançar no botão cancela o automático', () => {
        const { container } = montar()
        clicar(container, 1)
        seguir(container)
        act(() => { vi.advanceTimersByTime(2600) })
        expect(container.textContent).toContain('"n":2')
    })
})

describe('QuizScreen — teclado', () => {
    it('número ou letra responde', () => {
        const um = montar()
        tecla('2')
        expect(pontos(um.container)).toBe(150)
        cleanup()
        const outro = montar()
        tecla('B')
        expect(pontos(outro.container)).toBe(150)
    })

    it('resposta pelo teclado usa o relógio atual, como o clique', () => {
        const { container } = montar(1)
        passar(9)
        tecla('2')
        expect(pontos(container)).toBe(120)
        seguir(container)
        expect(fim).toHaveBeenCalledWith([1], 120, [9], 1)
    })

    it('Enter e Espaço avançam depois da resposta', () => {
        const { container } = montar()
        tecla('2')
        tecla('Enter')
        expect(container.textContent).toContain('"n":2')
        tecla('2')
        tecla(' ')
        expect(container.textContent).toContain('"n":3')
    })

    it('Enter na última entrega o resultado', () => {
        montar(1)
        tecla('2')
        tecla('Enter')
        expect(fim).toHaveBeenCalledWith([1], 150, [0], 1)
    })

    it.each(['metaKey', 'ctrlKey', 'altKey'])('atalho do navegador com %s não responde', (modificador) => {
        const { container } = montar()
        for (const k of ['a', 'c', '1']) tecla(k, { [modificador]: true })
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('Enter num link focado fica com o link', () => {
        const { container } = montar(2, [pergunta(1, { relatedHref: '/blog/x' }), pergunta(2)])
        tecla('2')
        expect(tecla('Enter', {}, container.querySelector('a[href="/blog/x"]')!)).toBe(true)
        expect(container.textContent).toContain('"n":1')
    })

    it('digitação em campo não responde', () => {
        const { container } = montar()
        const campo = document.body.appendChild(document.createElement('input'))
        tecla('2', {}, campo)
        campo.remove()
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('com o aviso de cookies aberto, o teclado não responde', () => {
        banner.estado = 'perguntar'
        const { container } = montar()
        tecla('2')
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('tecla fora do intervalo não responde', () => {
        const { container } = montar(1, [pergunta(1, { options: ['Sim', 'Não'] })])
        tecla('4')
        tecla('z')
        expect(container.textContent).not.toContain('Porque 1.')
    })
})

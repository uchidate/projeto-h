// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

// Cobre o quiz curto das fichas: resposta única, placar e sequência, resultado final por faixa de acerto
// e os atalhos de teclado (só com o quiz visível, sem roubar atalho do navegador nem Enter de link).
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))

import { MiniQuiz } from './MiniQuiz'

let observar: (visivel: boolean) => void = () => {}
const desconectar = vi.fn()

const pergunta = (id: number, extra: Record<string, unknown> = {}) => ({
    id, question: `Pergunta número ${id}?`, options: ['Um', 'Dois', 'Três'], correct: 1, explanation: `Porque ${id}.`, ...extra,
})
const tres = [pergunta(1), pergunta(2), pergunta(3)]

const montar = (items = tres) => render(<MiniQuiz items={items} entityName="IU" quizHref="/quiz/iu" />)
const opcoes = (c: Element) => Array.from(c.querySelectorAll<HTMLButtonElement>('div.grid button'))
const botao = (c: Element, texto: string) => Array.from(c.querySelectorAll('button')).find((b) => b.textContent?.includes(texto))!
const responder = (c: Element, idx: number) => fireEvent.click(opcoes(c)[idx])
const avancar = (c: Element) => fireEvent.click(botao(c, c.textContent!.includes('Ver resultado') ? 'Ver resultado' : 'Próxima'))
const tecla = (key: string, extra: Record<string, unknown> = {}, alvo: Element | Window = document.body) => fireEvent.keyDown(alvo, { key, ...extra })
const visivel = () => act(() => observar(true))

beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('IntersectionObserver', class {
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) { observar = (v) => cb([{ isIntersecting: v }]) }
        observe() {}
        disconnect() { desconectar() }
    })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('MiniQuiz — responder', () => {
    it('começa na primeira pergunta, sem placar nem explicação', () => {
        const { container } = montar()
        expect(container.textContent).toContain('Pergunta 1 de 3')
        expect(container.textContent).toContain('Pergunta número 1?')
        expect(container.textContent).not.toContain('acerto')
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('acerto mostra explicação e placar e trava as opções', () => {
        const { container } = montar()
        responder(container, 1)
        expect(container.textContent).toContain('Porque 1.')
        expect(container.textContent).toContain('1 acerto')
        expect(opcoes(container).every((b) => b.disabled)).toBe(true)
    })

    it('erro marca a escolhida em vermelho, a certa em verde e não pontua', () => {
        const { container } = montar()
        responder(container, 0)
        expect(opcoes(container)[0].className).toContain('border-red-500')
        expect(opcoes(container)[1].className).toContain('border-green-500')
        expect(opcoes(container)[2].className).not.toMatch(/border-(red|green)-500/)
        expect(container.textContent).not.toContain('acerto')
    })

    it('a sequência aparece a partir de dois acertos seguidos e zera no erro', () => {
        const { container } = montar([...tres, pergunta(4)])
        responder(container, 1)
        expect(container.textContent).not.toContain('🔥')
        avancar(container)
        responder(container, 1)
        expect(container.textContent).toContain('🔥 2x')
        expect(container.textContent).toContain('2 acertos')
        avancar(container)
        responder(container, 0)
        expect(container.textContent).not.toContain('🔥')
        expect(container.textContent).toContain('2 acertos')
    })

    it('mostra o link de leitura quando a pergunta tem um, com rótulo padrão', () => {
        const { container } = montar([pergunta(1, { relatedHref: '/blog/x' })])
        responder(container, 1)
        expect(container.querySelector('a[href="/blog/x"]')!.textContent).toContain('Saiba mais')
    })

    it('usa o rótulo do link quando vem preenchido', () => {
        const { container } = montar([pergunta(1, { relatedHref: '/blog/x', relatedLabel: 'Leia a matéria' })])
        responder(container, 1)
        expect(container.querySelector('a[href="/blog/x"]')!.textContent).toContain('Leia a matéria')
    })

    it('a última pergunta troca "Próxima" por "Ver resultado"', () => {
        const { container } = montar([pergunta(1), pergunta(2)])
        responder(container, 1)
        expect(botao(container, 'Próxima')).toBeTruthy()
        avancar(container)
        responder(container, 1)
        expect(botao(container, 'Ver resultado')).toBeTruthy()
    })
})

describe('MiniQuiz — resultado', () => {
    const jogar = (respostas: number[]) => {
        const tela = montar(respostas.map((_, n) => pergunta(n + 1)))
        for (const r of respostas) { responder(tela.container, r); avancar(tela.container) }
        return tela.container
    }

    it('tudo certo: perfeito, com placar e link para o quiz', () => {
        const c = jogar([1, 1])
        expect(c.textContent).toContain('Perfeito! Você é expert em IU')
        expect(c.textContent).toContain('2 de 2 corretas')
        expect(c.querySelector('a[href="/quiz/iu"]')).not.toBeNull()
    })

    it('metade já é "nada mal"', () => {
        expect(jogar([1, 0]).textContent).toContain('Nada mal! Você conhece IU')
    })

    it('abaixo da metade: "agora você sabe mais"', () => {
        const c = jogar([1, 0, 0])
        expect(c.textContent).toContain('Agora você sabe mais sobre IU')
        expect(c.textContent).toContain('1 de 3 corretas')
    })
})

describe('MiniQuiz — teclado', () => {
    it('ignora teclas enquanto o quiz não está visível', () => {
        const { container } = montar()
        tecla('2')
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('número ou letra responde quando visível', () => {
        const um = montar()
        visivel()
        tecla('2')
        expect(um.container.textContent).toContain('1 acerto')
        cleanup()
        const outro = montar()
        visivel()
        tecla('B')
        expect(outro.container.textContent).toContain('1 acerto')
    })

    it('tecla sem opção correspondente não responde', () => {
        const { container } = montar()
        visivel()
        tecla('4')
        tecla('z')
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('Enter e Espaço avançam depois da resposta', () => {
        const { container } = montar()
        visivel()
        tecla('2')
        // O efeito é religado a cada passo; no navegador o observer novo avisa a visibilidade na hora.
        visivel()
        tecla('Enter')
        expect(container.textContent).toContain('Pergunta 2 de 3')
        visivel()
        tecla('2')
        visivel()
        tecla(' ')
        expect(container.textContent).toContain('Pergunta 3 de 3')
    })

    it('depois da resposta, outra letra não troca a escolha', () => {
        const { container } = montar()
        visivel()
        tecla('1')
        visivel()
        tecla('2')
        expect(opcoes(container)[0].className).toContain('border-red-500')
        expect(container.textContent).not.toContain('acerto')
    })

    it.each(['metaKey', 'ctrlKey', 'altKey'])('atalho do navegador com %s não responde', (modificador) => {
        const { container } = montar()
        visivel()
        for (const k of ['a', 'c', '1']) tecla(k, { [modificador]: true })
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('Enter num link ou botão focado fica com ele e não avança o quiz', () => {
        const { container } = montar([pergunta(1, { relatedHref: '/blog/x' }), pergunta(2)])
        visivel()
        tecla('2')
        visivel()
        const link = container.querySelector('a[href="/blog/x"]')!
        expect(tecla('Enter', {}, link)).toBe(true)
        expect(tecla(' ', {}, botao(container, 'Próxima'))).toBe(true)
        expect(container.textContent).toContain('Pergunta 1 de 2')
    })

    it('digitação em campo de formulário não responde', () => {
        const { container } = montar()
        visivel()
        for (const nome of ['input', 'textarea', 'select']) {
            const campo = document.body.appendChild(document.createElement(nome))
            tecla('2', {}, campo)
            campo.remove()
        }
        expect(container.textContent).not.toContain('Porque 1.')
    })

    it('no resultado o quiz para de ouvir o teclado', () => {
        const { container } = montar([pergunta(1)])
        visivel()
        tecla('2')
        desconectar.mockClear()
        avancar(container)
        expect(desconectar).toHaveBeenCalled()
        tecla('Enter')
        expect(container.textContent).toContain('1 de 1 corretas')
    })

    it('sem IntersectionObserver o quiz segue funcionando pelo clique', () => {
        vi.stubGlobal('IntersectionObserver', undefined)
        const { container } = montar()
        tecla('2')
        expect(container.textContent).not.toContain('Porque 1.')
        responder(container, 1)
        expect(container.textContent).toContain('Porque 1.')
    })
})

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HeroCarousel } from './HeroCarousel'

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))

const LARGURA = 500
const scrollTo = vi.fn()
let reduzido = false
let observador: ((entries: { isIntersecting: boolean }[]) => void) | null = null

function montar(n = 3) {
    const r = render(
        <HeroCarousel>
            {Array.from({ length: n }, (_, i) => <p key={i}>slide {i + 1}</p>)}
        </HeroCarousel>,
    )
    const trilho = r.container.querySelector('.snap-x') as HTMLElement
    return { ...r, trilho }
}

const avancar = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const proximo = () => fireEvent.click(screen.getByLabelText('proximo'))
const anterior = () => fireEvent.click(screen.getByLabelText('anterior'))

beforeEach(() => {
    vi.useFakeTimers()
    reduzido = false
    observador = null
    scrollTo.mockClear()
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => LARGURA })
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
    window.matchMedia = ((q: string) => ({
        matches: reduzido,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    window.IntersectionObserver = class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { observador = cb }
        observe() {}
        disconnect() {}
    } as unknown as typeof IntersectionObserver
})
afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe('HeroCarousel: estrutura', () => {
    it('todos os slides ficam no HTML, com rótulos de acessibilidade', () => {
        montar()
        expect(screen.getAllByRole('group')).toHaveLength(3)
        expect(screen.getByText('slide 3')).toBeTruthy()
        expect(screen.getByRole('group', { name: 'slide~{"n":2,"total":3}' })).toBeTruthy()
        expect(screen.getByRole('region').getAttribute('aria-roledescription')).toBe('carousel')
    })

    it('pontos e contador começam no primeiro slide', () => {
        montar()
        const pontos = screen.getAllByRole('tab')
        expect(pontos).toHaveLength(3)
        expect(pontos.map(p => p.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
        expect(screen.getByText('1 / 3')).toBeTruthy()
    })
})

describe('HeroCarousel: navegação manual', () => {
    it('próximo e ponto rolam até a posição do slide, com animação', () => {
        montar()
        proximo()
        expect(scrollTo).toHaveBeenLastCalledWith({ left: LARGURA, behavior: 'smooth' })
        fireEvent.click(screen.getByLabelText('irPara~{"n":3}'))
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 2 * LARGURA, behavior: 'smooth' })
    })

    it('anterior no primeiro slide volta ao último', () => {
        montar()
        anterior()
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 2 * LARGURA, behavior: 'smooth' })
    })

    it('a rolagem (gesto) atualiza o slide atual, o ponto e o contador', () => {
        const { trilho } = montar()
        trilho.scrollLeft = LARGURA
        fireEvent.scroll(trilho)
        avancar(20)
        expect(screen.getByText('2 / 3')).toBeTruthy()
        expect(screen.getAllByRole('tab')[1].getAttribute('aria-selected')).toBe('true')
    })
})

describe('HeroCarousel: avanço automático', () => {
    it('avança a cada 7 segundos', () => {
        montar()
        avancar(6999)
        expect(scrollTo).not.toHaveBeenCalled()
        avancar(1)
        expect(scrollTo).toHaveBeenCalledWith({ left: LARGURA, behavior: 'smooth' })
    })

    it('o botão de pausa desliga o avanço e troca o rótulo; retomar religa', () => {
        const { trilho } = montar()
        expect(trilho.getAttribute('aria-live')).toBe('off')
        fireEvent.click(screen.getByLabelText('pausar'))
        expect(screen.getByLabelText('retomar')).toBeTruthy()
        expect(trilho.getAttribute('aria-live')).toBe('polite')
        avancar(30000)
        expect(scrollTo).not.toHaveBeenCalled()
        fireEvent.click(screen.getByLabelText('retomar'))
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('usar um controle adia o avanço e ele volta depois de 10 segundos', () => {
        montar()
        proximo()
        scrollTo.mockClear()
        avancar(9999)
        expect(scrollTo).not.toHaveBeenCalled()
        avancar(1) // fim da pausa de 10 s: o intervalo é rearmado
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('toque e roda do mouse no trilho também adiam', () => {
        const { trilho } = montar()
        fireEvent.touchStart(trilho)
        avancar(9000)
        expect(scrollTo).not.toHaveBeenCalled()
        fireEvent.wheel(trilho)
        avancar(9000)
        expect(scrollTo).not.toHaveBeenCalled()
    })

    it('aba em segundo plano suspende e voltar retoma', () => {
        montar()
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
        act(() => { document.dispatchEvent(new Event('visibilitychange')) })
        avancar(20000)
        expect(scrollTo).not.toHaveBeenCalled()
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
        act(() => { document.dispatchEvent(new Event('visibilitychange')) })
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('carrossel fora da tela não avança', () => {
        montar()
        act(() => observador!([{ isIntersecting: false }]))
        avancar(20000)
        expect(scrollTo).not.toHaveBeenCalled()
        act(() => observador!([{ isIntersecting: true }]))
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('sem IntersectionObserver continua funcionando', () => {
        // @ts-expect-error simula navegador sem a API
        delete window.IntersectionObserver
        montar()
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })
})

describe('HeroCarousel: mouse', () => {
    it('mouse em cima pausa; sair retoma; toque não pausa', () => {
        const { container } = montar()
        const raiz = container.firstElementChild as HTMLElement
        fireEvent.pointerEnter(raiz, { pointerType: 'mouse' })
        avancar(20000)
        expect(scrollTo).not.toHaveBeenCalled()
        fireEvent.pointerLeave(raiz, { pointerType: 'mouse' })
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
        scrollTo.mockClear()
        fireEvent.pointerEnter(raiz, { pointerType: 'touch' })
        avancar(7000)
        expect(scrollTo).toHaveBeenCalledTimes(1)
    })
})

describe('HeroCarousel: menos movimento', () => {
    it('com a preferência ligada não há avanço nem botão de pausa e a rolagem é direta', () => {
        reduzido = true
        montar()
        expect(screen.queryByLabelText('pausar')).toBeNull()
        avancar(30000)
        expect(scrollTo).not.toHaveBeenCalled()
        proximo()
        expect(scrollTo).toHaveBeenLastCalledWith({ left: LARGURA, behavior: 'auto' })
    })
})

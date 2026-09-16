// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resetAdQueueForTests } from '@/lib/utils/adQueue'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AdSlot } from './AdSlot'
import { AdsProvider } from '@/components/providers/AdsProvider'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'

let observerInstances: { callback: IntersectionObserverCallback }[] = []

class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    observe = vi.fn()
    disconnect = vi.fn()
    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        observerInstances.push(this)
    }
}

function triggerIntersection(index = 0, isIntersecting = true) {
    act(() => {
        observerInstances[index].callback(
            [{ isIntersecting } as IntersectionObserverEntry],
            observerInstances[index] as unknown as IntersectionObserver,
        )
    })
}

function settings(overrides: Partial<MonetizationSettings> = {}): MonetizationSettings {
    return {
        enabled: true,
        client: 'ca-pub-123',
        slots: { inline: 'slot-inline-id', article_sidebar: 'slot-sidebar-id', post_suggestion: 'slot-post-suggestion-id', leaderboard: 'slot-leaderboard-id', sticky: 'slot-sticky-id' },
        ...overrides,
    }
}

describe('AdSlot', () => {
    beforeEach(() => {
        resetAdQueueForTests()
        observerInstances = []
        // @ts-expect-error mock global
        global.IntersectionObserver = MockIntersectionObserver
        window.adsbygoogle = []
        // jsdom não faz layout: todo elemento tem largura 0 e o push seria adiado.
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 300 })
        window.gtag = vi.fn()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        })
    })
    afterEach(() => vi.useRealTimers())

    it('não renderiza nada quando ads.enabled é false', () => {
        const { container } = render(
            <AdsProvider settings={settings({ enabled: false })}><AdSlot slot="inline" /></AdsProvider>,
        )
        expect(container).toBeEmptyDOMElement()
        expect(window.adsbygoogle).toHaveLength(0)
    })

    it('não renderiza nada sem client configurado', () => {
        const { container } = render(
            <AdsProvider settings={settings({ client: '' })}><AdSlot slot="inline" /></AdsProvider>,
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('resolve o slot nomeado (ex: "inline") pro ID configurado em ads.slots', () => {
        const { container } = render(
            <AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>,
        )
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-inline-id')
    })

    it('usa o ID próprio da posição quando configurado', () => {
        const { container } = render(
            <AdsProvider settings={settings({ placements: { artists_grid: '9876543210' } })}><AdSlot slot="inline" analyticsPlacement="artists_grid" /></AdsProvider>,
        )
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', '9876543210')
    })

    it('cai no slot genérico quando a posição não tem ID próprio', () => {
        const { container } = render(
            <AdsProvider settings={settings({ placements: { artists_grid: '9876543210' } })}><AdSlot slot="inline" analyticsPlacement="hub_feed" /></AdsProvider>,
        )
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-inline-id')
    })

    it('usa o valor do slot diretamente quando não é um nome conhecido', () => {
        const { container } = render(
            <AdsProvider settings={settings()}><AdSlot slot="12345" /></AdsProvider>,
        )
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', '12345')
    })

    it('mostra o label "Publicidade" por padrão', () => {
        render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        expect(screen.getByText('Publicidade')).toBeInTheDocument()
    })

    it('não mostra o label quando label=false', () => {
        render(<AdsProvider settings={settings()}><AdSlot slot="inline" label={false} /></AdsProvider>)
        expect(screen.queryByText('Publicidade')).not.toBeInTheDocument()
    })

    it('sem lazy, renderiza o <ins> imediatamente', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        expect(container.querySelector('ins.adsbygoogle')).toBeInTheDocument()
        expect(container.querySelector('[data-ad-container]')).toHaveAttribute('data-ad-state', 'loading')
        expect(container.querySelector('[data-ad-container]')).toHaveAttribute('aria-busy', 'true')
    })

    it('com lazy, não renderiza o <ins> até entrar em viewport', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" lazy /></AdsProvider>)
        expect(container.querySelector('ins.adsbygoogle')).not.toBeInTheDocument()
    })

    it('com lazy, renderiza o <ins> após IntersectionObserver disparar', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" lazy /></AdsProvider>)
        triggerIntersection(0, true)
        expect(container.querySelector('ins.adsbygoogle')).toBeInTheDocument()
    })

    it('dá push no window.adsbygoogle quando fica visível', () => {
        render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        expect(window.adsbygoogle.length).toBe(1)
    })

    it('não dá push duplicado ao re-renderizar', () => {
        const { rerender } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        rerender(<AdsProvider settings={settings()}><AdSlot slot="inline" className="x" /></AdsProvider>)
        expect(window.adsbygoogle.length).toBe(1)
    })

    it('não monta nem solicita um placement fora da viewport elegível', () => {
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" mediaQuery="(min-width: 1280px)" />
            </AdsProvider>,
        )
        expect(container).toBeEmptyDOMElement()
        expect(window.adsbygoogle).toHaveLength(0)
    })

    it('monta e solicita o placement quando a viewport é elegível', async () => {
        vi.mocked(window.matchMedia).mockImplementation(() => ({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList))
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" mediaQuery="(min-width: 1280px)" />
            </AdsProvider>,
        )
        await waitFor(() => expect(container.querySelector('ins')).toBeInTheDocument())
        await waitFor(() => expect(window.adsbygoogle).toHaveLength(1))
    })

    it('remove toda a reserva quando o AdSense informa unfilled', async () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        container.querySelector('ins')?.setAttribute('data-ad-status', 'unfilled')
        await waitFor(() => expect(container).toBeEmptyDOMElement())
        expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_status', {
            ad_placement: 'inline', ad_format: 'auto', ad_status: 'unfilled',
        })
    })

    it('remove a reserva no estado unfill-optimized usado pelo AdSense', async () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlot slot="inline" /></AdsProvider>)
        container.querySelector('ins')?.setAttribute('data-ad-status', 'unfill-optimized')
        await waitFor(() => expect(container).toBeEmptyDOMElement())
        expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_status', {
            ad_placement: 'inline', ad_format: 'auto', ad_status: 'unfilled',
        })
    })

    it('usa o nome analítico da zona sem alterar o ID do slot', async () => {
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" analyticsPlacement="artist_profile_mid" />
            </AdsProvider>,
        )
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-inline-id')
        container.querySelector('ins')?.setAttribute('data-ad-status', 'filled')
        await waitFor(() => expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_status', {
            ad_placement: 'artist_profile_mid', ad_format: 'auto', ad_status: 'filled',
        }))
        expect(container.querySelector('[data-ad-container]')).toHaveAttribute('data-ad-state', 'filled')
        expect(container.querySelector('[data-ad-container]')).toHaveAttribute('aria-busy', 'false')
    })

    it('remove o espaço quando o AdSense não responde dentro do limite', () => {
        vi.useFakeTimers()
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" analyticsPlacement="artist_bio_sidebar" emptyTimeoutMs={1000} />
            </AdsProvider>,
        )
        expect(container.querySelector('ins')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(1000))
        expect(container).toBeEmptyDOMElement()
        expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_status', {
            ad_placement: 'artist_bio_sidebar',
            ad_format: 'auto',
            ad_status: 'timeout',
        })
    })

    it('não consome o prazo antes de o slot lazy pedir o anúncio', () => {
        vi.useFakeTimers()
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" lazy analyticsPlacement="artist_bio_desktop" emptyTimeoutMs={1000} />
            </AdsProvider>,
        )

        act(() => vi.advanceTimersByTime(1500))
        expect(container).not.toBeEmptyDOMElement()
        expect(container.querySelector('ins')).not.toBeInTheDocument()

        triggerIntersection(0, true)
        expect(container.querySelector('ins')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(999))
        expect(container.querySelector('ins')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(1))
        expect(container).toBeEmptyDOMElement()
    })

    it('mantém o espaço quando o AdSense já assumiu o slot e ainda não decidiu', () => {
        vi.useFakeTimers()
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" analyticsPlacement="home_leaderboard" emptyTimeoutMs={1000} />
            </AdsProvider>,
        )

        // É o que o AdSense faz ao pegar o slot, antes de resolver o leilão.
        container.querySelector('ins')?.setAttribute('data-adsbygoogle-status', 'done')
        act(() => vi.advanceTimersByTime(1000))
        expect(container.querySelector('ins')).toBeInTheDocument()

        // Um unfilled real continua removendo, agora pelo caminho legítimo. O
        // MutationObserver entrega em microtask, então aqui vale timer real.
        vi.useRealTimers()
        container.querySelector('ins')?.setAttribute('data-ad-status', 'unfilled')
        return waitFor(() => expect(container).toBeEmptyDOMElement())
    })

    it('remove a reserva se o push for rejeitado pelo navegador ou bloqueador', () => {
        vi.useFakeTimers()
        window.adsbygoogle = [] as Array<Record<string, unknown>>
        window.adsbygoogle.push = vi.fn(() => {
            throw new Error('blocked')
        })

        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlot slot="inline" analyticsPlacement="artist_bio_desktop" emptyTimeoutMs={1000} />
            </AdsProvider>,
        )

        expect(container.querySelector('ins')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(1000))
        expect(container).toBeEmptyDOMElement()
        expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_status', {
            ad_placement: 'artist_bio_desktop',
            ad_format: 'auto',
            ad_status: 'timeout',
        })
    })

})

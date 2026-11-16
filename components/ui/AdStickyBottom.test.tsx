// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resetAdQueueForTests } from '@/lib/utils/adQueue'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { AdStickyBottom } from './AdStickyBottom'
import { AdsProvider } from '@/components/providers/AdsProvider'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'

function settings(overrides: Partial<MonetizationSettings> = {}): MonetizationSettings {
    return {
        enabled: true,
        client: 'ca-pub-123',
        slots: { inline: 'slot-inline', article_sidebar: '', post_suggestion: '', leaderboard: 'slot-leaderboard', sticky: 'slot-sticky-id' },
        ...overrides,
    }
}

describe('AdStickyBottom', () => {
    beforeEach(() => {
        resetAdQueueForTests()
        vi.useFakeTimers()
        window.adsbygoogle = []
        // jsdom não faz layout: todo elemento tem largura 0 e o push seria adiado.
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 300 })
        sessionStorage.clear()
        window.gtag = vi.fn()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        })
    })
    afterEach(() => vi.useRealTimers())

    it('não renderiza nada antes da espera pós-load', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza após 2,5s', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        expect(container.querySelector('ins.adsbygoogle')).toBeInTheDocument()
    })

    it('não renderiza nem faz push quando ads.enabled é false', () => {
        const { container } = render(<AdsProvider settings={settings({ enabled: false })}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        expect(container).toBeEmptyDOMElement()
        expect(window.adsbygoogle).toHaveLength(0)
    })

    it('não cria nem pede o sticky fora do viewport mobile', () => {
        vi.mocked(window.matchMedia).mockImplementation(() => ({
            matches: false,
            media: '(max-width: 639px)',
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(30_000))
        expect(container).toBeEmptyDOMElement()
        expect(window.adsbygoogle).toHaveLength(0)
    })

    it('não reaparece quando foi fechado na mesma sessão', () => {
        sessionStorage.setItem('portal_ad_sticky_dismissed', '1')
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(5000))
        expect(container).toBeEmptyDOMElement()
        expect(window.adsbygoogle).toHaveLength(0)
    })

    it('resolve o slot nomeado pro ID configurado', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-sticky-id')
        expect(container.querySelector('ins')).toHaveStyle({ width: '100%', minHeight: '100px' })
        expect(container.querySelector('ins')).toHaveAttribute('data-full-width-responsive', 'false')
    })

    it('clicar em fechar dispensa o anúncio durante a sessão', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        fireEvent.click(screen.getByRole('button', { name: /fechar anúncio/i }))
        expect(container).toBeEmptyDOMElement()
        expect(sessionStorage.getItem('portal_ad_sticky_dismissed')).toBe('1')
        expect(window.gtag).toHaveBeenCalledWith('event', 'ad_slot_dismissed', {
            ad_placement: 'sticky',
        })
    })

    it('dá push no window.adsbygoogle uma única vez ao ficar visível', () => {
        render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        expect(window.adsbygoogle.length).toBe(1)
    })

    it('remove a barra inteira quando o slot não é preenchido', async () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        await act(async () => {
            container.querySelector('ins')?.setAttribute('data-ad-status', 'unfilled')
            await Promise.resolve()
        })
        expect(container).toBeEmptyDOMElement()
    })

    it('aceita variantes unfill do AdSense', async () => {
        const { container } = render(<AdsProvider settings={settings()}><AdStickyBottom slot="sticky" /></AdsProvider>)
        act(() => vi.advanceTimersByTime(3000))
        await act(async () => {
            container.querySelector('ins')?.setAttribute('data-ad-status', 'unfill-optimized')
            await Promise.resolve()
        })
        expect(container).toBeEmptyDOMElement()
    })
})

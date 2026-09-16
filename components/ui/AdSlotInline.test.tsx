// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetAdQueueForTests } from '@/lib/utils/adQueue'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AdSlotInline } from './AdSlotInline'
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

function triggerIntersection(index = 0) {
    act(() => {
        observerInstances[index].callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            observerInstances[index] as unknown as IntersectionObserver,
        )
    })
}

function settings(overrides: Partial<MonetizationSettings> = {}): MonetizationSettings {
    return {
        enabled: true,
        client: 'ca-pub-123',
        slots: { inline: 'slot-inline-id', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
        ...overrides,
    }
}

describe('AdSlotInline', () => {
    beforeEach(() => {
        resetAdQueueForTests()
        observerInstances = []
        // @ts-expect-error mock global
        global.IntersectionObserver = MockIntersectionObserver
    })

    it('renderiza o aside com aria-label "Publicidade"', () => {
        render(<AdsProvider settings={settings()}><AdSlotInline slot="inline" analyticsPlacement="test_content" /></AdsProvider>)
        expect(screen.getByRole('complementary', { name: 'Publicidade' })).toBeInTheDocument()
    })

    it('resolve o slot nomeado pro ID configurado', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlotInline slot="inline" analyticsPlacement="test_content" /></AdsProvider>)
        triggerIntersection()
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-inline-id')
    })

    it('usa formato "auto" por padrão (Google escolhe o tamanho por viewport)', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlotInline slot="inline" analyticsPlacement="test_content" /></AdsProvider>)
        triggerIntersection()
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-format', 'auto')
        expect(container.querySelector('ins')).toHaveAttribute('data-full-width-responsive', 'false')
        expect(screen.getByRole('complementary')).toHaveAttribute('data-ad-layout', 'content')
    })

    it('resolve toda a política da sidebar sem configuração dimensional na página', () => {
        const { container } = render(
            <AdsProvider settings={settings()}><AdSlotInline slot="inline" layout="sidebar" analyticsPlacement="test_sidebar" /></AdsProvider>,
        )
        const aside = screen.getByRole('complementary')
        expect(aside).toHaveAttribute('data-ad-layout', 'sidebar')
        expect(aside).toHaveClass('my-0')
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-format', 'rectangle')
        expect(container.querySelector('ins')?.parentElement?.parentElement).toHaveStyle({ maxWidth: '300px' })
    })

    it.each([
        ['content', '728px', '728'],
        ['feed', '970px', '970'],
        ['leaderboard', '970px', '970'],
        ['sidebar', '300px', '300'],
    ] as const)('aplica o contrato físico de %s antes do pedido ao AdSense', (layout, cssWidth, contractWidth) => {
        const { container } = render(
            <AdsProvider settings={settings()}><AdSlotInline slot="inline" layout={layout} analyticsPlacement={`test_${layout}`} /></AdsProvider>,
        )
        const frame = container.querySelector(`[data-ad-layout="${layout}"] > div`)
        expect(frame).toHaveStyle({ maxWidth: cssWidth })
        expect(frame).toHaveAttribute('data-ad-max-width', contractWidth)
        expect(frame).toHaveAttribute('data-ad-placement', `test_${layout}`)
    })

    // Este caso exigia `horizontal`, para impedir anúncio de tela inteira no
    // Safari mobile. A proteção continua — mas ela nunca esteve no formato, e
    // sim no `full-width-responsive`, que é o que autoriza o Google a trocar um
    // horizontal por unidade alta (ver `responsiveExpansion` em AdSlot.tsx).
    //
    // O formato voltou a ser `auto` porque `horizontal` preenchia 6,4% contra
    // 50% do `article_body` na mesma página. O teste passa a travar a proteção
    // onde ela de fato mora, em vez de travar junto um efeito colateral caro.
    it('mantém full-width-responsive desligado no leaderboard, sem prender o formato', () => {
        const { container } = render(
            <AdsProvider settings={settings()}><AdSlotInline slot="inline" layout="leaderboard" analyticsPlacement="test_leaderboard" /></AdsProvider>,
        )
        triggerIntersection()
        expect(container.querySelector('ins')).toHaveAttribute('data-full-width-responsive', 'false')
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-format', 'auto')
    })

    it('aceita formato customizado "horizontal"', () => {
        const { container } = render(<AdsProvider settings={settings()}><AdSlotInline slot="inline" format="horizontal" analyticsPlacement="test_override" /></AdsProvider>)
        triggerIntersection()
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-format', 'horizontal')
    })

    it('mantém o nome analítico separado do ID do AdSense', () => {
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlotInline slot="inline" analyticsPlacement="article_body" />
            </AdsProvider>,
        )
        triggerIntersection()
        expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', 'slot-inline-id')
    })

    it('não renderiza nada quando ads está desabilitado', () => {
        const { container } = render(<AdsProvider settings={settings({ enabled: false })}><AdSlotInline slot="inline" analyticsPlacement="test_disabled" /></AdsProvider>)
        expect(container).toBeEmptyDOMElement()
    })

    it('remove também o wrapper e suas margens quando não há inventário', async () => {
        const { container } = render(
            <AdsProvider settings={settings()}>
                <AdSlotInline slot="inline" analyticsPlacement="article_body" />
            </AdsProvider>,
        )
        triggerIntersection()
        container.querySelector('ins')?.setAttribute('data-ad-status', 'unfill-optimized')
        await waitFor(() => expect(container).toBeEmptyDOMElement())
        expect(screen.queryByRole('complementary', { name: 'Publicidade' })).not.toBeInTheDocument()
    })
})

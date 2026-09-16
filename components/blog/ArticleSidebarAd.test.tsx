// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ArticleSidebarAd, TALL_SIDEBAR_MIN_READING_MINUTES } from './ArticleSidebarAd'

vi.mock('@/components/ui/AdSlot', () => ({
    AdSlot: (props: Record<string, unknown>) => (
        <div
            data-testid="ad-slot"
            data-format={props.format}
            data-placement={props.analyticsPlacement}
            data-media-query={props.mediaQuery}
        />
    ),
}))

describe('ArticleSidebarAd', () => {
    it('mantém o retângulo responsivo em artigos curtos', () => {
        render(<ArticleSidebarAd slot="article_sidebar" readingMinutes={TALL_SIDEBAR_MIN_READING_MINUTES - 1} />)

        const ad = screen.getByTestId('ad-slot')
        expect(ad).toHaveAttribute('data-format', 'rectangle')
        expect(ad).toHaveAttribute('data-placement', 'article_sidebar')
        expect(ad).toHaveAttribute('data-media-query', '(min-width: 1280px)')
    })

    it('usa vertical em telas altas e preserva retângulo em notebooks baixos', () => {
        render(<ArticleSidebarAd slot="article_sidebar" readingMinutes={TALL_SIDEBAR_MIN_READING_MINUTES} />)

        const [tall, fallback] = screen.getAllByTestId('ad-slot')
        expect(tall).toHaveAttribute('data-format', 'vertical')
        expect(tall).toHaveAttribute('data-placement', 'article_sidebar_tall')
        expect(tall).toHaveAttribute('data-media-query', '(min-width: 1280px) and (min-height: 850px)')
        expect(fallback).toHaveAttribute('data-format', 'rectangle')
        expect(fallback).toHaveAttribute('data-media-query', '(min-width: 1280px) and (max-height: 849px)')
    })
})

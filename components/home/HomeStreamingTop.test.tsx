// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeStreamingTop } from './HomeStreamingTop'
import type { ShowsByPlatform, StreamingEntry } from '@/lib/tmdb/streaming'

function show(overrides: Partial<StreamingEntry> = {}): StreamingEntry {
    return {
        tmdbId: '1',
        title: 'Show Teste',
        posterUrl: null,
        rank: 1,
        year: null,
        rating: null,
        isKorean: true,
        productionSlug: null,
        ...overrides,
    }
}

describe('HomeStreamingTop', () => {
    it('não renderiza nada quando nenhuma plataforma tem shows', () => {
        const { container } = render(<HomeStreamingTop showsByPlatform={{} as ShowsByPlatform} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra apenas as abas de plataformas com shows disponíveis', () => {
        render(<HomeStreamingTop showsByPlatform={{ netflix_br: [show()], disney_br: [] }} />)
        expect(screen.getByText('Netflix')).toBeInTheDocument()
        expect(screen.queryByText('Disney+')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Mostrar ranking da Netflix' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('usa a primeira plataforma disponível como aba ativa por padrão', () => {
        render(<HomeStreamingTop showsByPlatform={{ prime_br: [show({ title: 'Prime Show' })] }} />)
        expect(screen.getByText('Prime Show')).toBeInTheDocument()
    })

    it('clicar em outra aba troca os shows exibidos', async () => {
        const user = userEvent.setup()
        render(<HomeStreamingTop showsByPlatform={{
            netflix_br: [show({ tmdbId: '1', title: 'Netflix Show' })],
            apple_br: [show({ tmdbId: '2', title: 'Apple Show' })],
        }} />)

        expect(screen.getByText('Netflix Show')).toBeInTheDocument()
        expect(screen.queryByText('Apple Show')).not.toBeInTheDocument()

        await user.click(screen.getByText('Apple TV+'))
        expect(screen.getByText('Apple Show')).toBeInTheDocument()
        expect(screen.queryByText('Netflix Show')).not.toBeInTheDocument()
    })

    it('mapeia a chave da plataforma pro slug de filtro correto do link "Top 10"', () => {
        render(<HomeStreamingTop showsByPlatform={{ prime_br: [show()] }} />)
        expect(screen.getByRole('link', { name: /top 10 nos streamings/i })).toHaveAttribute(
            'href', '/productions?platform=amazon-prime-video',
        )
    })

    it('limita a exibição a 10 shows mesmo com mais na lista', () => {
        const shows = Array.from({ length: 15 }, (_, i) => show({ tmdbId: String(i), title: `Show ${i}`, rank: i + 1 }))
        render(<HomeStreamingTop showsByPlatform={{ netflix_br: shows }} />)
        expect(screen.getByText('Show 9')).toBeInTheDocument()
        expect(screen.queryByText('Show 10')).not.toBeInTheDocument()
    })

    it('linka pro /productions/{slug} quando o show tem productionSlug', () => {
        render(<HomeStreamingTop showsByPlatform={{ netflix_br: [show({ productionSlug: 'meu-show' })] }} />)
        expect(screen.getByRole('link', { name: /show teste/i })).toHaveAttribute('href', '/productions/meu-show')
    })

    it('não linka o card quando o show não tem productionSlug', () => {
        render(<HomeStreamingTop showsByPlatform={{ netflix_br: [show({ productionSlug: null })] }} />)
        expect(screen.queryByRole('link', { name: /show teste/i })).not.toBeInTheDocument()
    })

    it('mostra o rating formatado quando presente e > 0', () => {
        render(<HomeStreamingTop showsByPlatform={{ netflix_br: [show({ rating: 8.234 })] }} />)
        expect(screen.getByText('8.2')).toBeInTheDocument()
    })
})

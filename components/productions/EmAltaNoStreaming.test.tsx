// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { StreamingEntry } from '@/lib/tmdb/streaming'

vi.mock('@/components/i18n/LocalizedLink', () => ({ default: ({ href, children, ...r }: React.ComponentProps<'a'>) => <a href={href} {...r}>{children}</a> }))
// eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
vi.mock('next/image', () => ({ default: ({ fill: _fill, ...p }: Record<string, unknown>) => <img {...p} /> }))

import { EmAltaNoStreaming } from './EmAltaNoStreaming'

const obra = (id: string, title: string, posterUrl: string | null = null): StreamingEntry =>
    ({ rank: 1, tmdbId: id, title, posterUrl, year: null, rating: 8.5, isKorean: true, productionSlug: `obra-${id}` })

afterEach(cleanup)

describe('EmAltaNoStreaming', () => {
    it('não desenha nada sem obras', () => {
        const { container } = render(<EmAltaNoStreaming porPlataforma={{ netflix_br: [] }} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('é um bloco medido, que não se apresenta como ranking oficial', () => {
        const { container } = render(<EmAltaNoStreaming porPlataforma={{ netflix_br: [obra('1', 'Primeira', 'p.jpg')] }} credito={<span>JustWatch</span>} />)
        expect(container.querySelector('section')).toHaveAttribute('data-bloco', 'producao-streaming')
        expect(screen.getByRole('heading', { name: 'Em alta no streaming' })).toBeInTheDocument()
        expect(container).toHaveTextContent('segundo o TMDB')
        expect(container.textContent).not.toMatch(/top ?10|ranking/i)
        expect(screen.getByRole('link', { name: 'Primeira' })).toHaveAttribute('href', '/productions/obra-1')
        expect(screen.getByRole('link', { name: 'Ver produções na Netflix' })).toHaveAttribute('href', '/productions?platform=netflix')
        expect(screen.getByText('JustWatch')).toBeInTheDocument()
    })

    it('troca de plataforma pelas abas, só entre as que têm obras', () => {
        render(<EmAltaNoStreaming porPlataforma={{ netflix_br: [obra('1', 'Da Netflix')], disney_br: [], prime_br: [obra('2', 'Do Prime')] }} />)
        expect(screen.queryByRole('button', { name: 'Disney+' })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true')
        fireEvent.click(screen.getByRole('button', { name: 'Prime Video' }))
        expect(screen.queryByText('Da Netflix')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Do Prime' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Ver produções na Prime Video' })).toHaveAttribute('href', '/productions?platform=amazon-prime-video')
    })

    it('volta à primeira disponível quando a plataforma escolhida some', () => {
        const { rerender } = render(<EmAltaNoStreaming porPlataforma={{ netflix_br: [obra('1', 'A')], apple_br: [obra('2', 'B')] }} />)
        fireEvent.click(screen.getByRole('button', { name: 'Apple TV+' }))
        rerender(<EmAltaNoStreaming porPlataforma={{ netflix_br: [obra('1', 'A')] }} />)
        expect(screen.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('link', { name: 'A' })).toBeInTheDocument()
    })
})

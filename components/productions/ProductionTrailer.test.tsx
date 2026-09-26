// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductionTrailer } from './ProductionTrailer'

describe('ProductionTrailer', () => {
    it('começa só com a miniatura e o botão: nenhum iframe carregado', () => {
        const { container } = render(<ProductionTrailer videoId="abc123" title="Trailer de X" playLabel="Reproduzir" />)
        expect(container.querySelector('iframe')).toBeNull()
        expect(screen.getByRole('button', { name: 'Reproduzir' })).toBeInTheDocument()
    })

    it('no clique troca a miniatura pelo player, com autoplay, sem cookies e título acessível', () => {
        const { container } = render(<ProductionTrailer videoId="abc123" title="Trailer de X" playLabel="Reproduzir" />)
        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }))
        const frame = container.querySelector('iframe')!
        expect(frame.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0')
        expect(frame).toHaveAttribute('title', 'Trailer de X')
        expect(screen.queryByRole('button', { name: 'Reproduzir' })).toBeNull()
    })
})

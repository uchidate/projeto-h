// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd, omitNulls } from './JsonLd'

describe('omitNulls', () => {
    it('retorna undefined para valores null (omite do JSON.stringify)', () => {
        expect(omitNulls('x', null)).toBeUndefined()
    })

    it('preserva valores não-null (incluindo 0, false, string vazia)', () => {
        expect(omitNulls('x', 0)).toBe(0)
        expect(omitNulls('x', false)).toBe(false)
        expect(omitNulls('x', '')).toBe('')
        expect(omitNulls('x', 'texto')).toBe('texto')
    })
})

describe('JsonLd', () => {
    it('renderiza <script type="application/ld+json"> com os dados serializados', () => {
        const { container } = render(<JsonLd data={{ '@type': 'Movie', name: 'Meu Filme' }} />)
        const script = container.querySelector('script[type="application/ld+json"]')
        expect(script?.innerHTML).toContain('Meu Filme')
    })

    it('omite campos com valor null do JSON-LD gerado', () => {
        const { container } = render(<JsonLd data={{ name: 'X', numberOfEpisodes: null }} />)
        const script = container.querySelector('script')
        expect(script?.innerHTML).not.toContain('numberOfEpisodes')
    })

    it('preserva campos com valor 0 (não confunde com null/omitido)', () => {
        const { container } = render(<JsonLd data={{ rating: 0 }} />)
        const script = container.querySelector('script')
        expect(script?.innerHTML).toContain('"rating":0')
    })
})

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PremiosSelos, foiIndicacao } from './PremiosSelos'

const base = { year: '2020', category: 'Melhor Ator', title: '', event: 'Baeksang' }

describe('PremiosSelos', () => {
    it('reconhece indicação pelo texto', () => {
        expect(foiIndicacao({ ...base, category: 'Indicado a Melhor Ator' })).toBe(true)
        expect(foiIndicacao(base)).toBe(false)
    })

    it('não renderiza sem prêmios', () => {
        const { container } = render(<PremiosSelos awards={[]} kicker="k" title="t" labels={{ won: 'V', nominated: 'I' }} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('ordena do mais recente e esconde título "—"', () => {
        render(<PremiosSelos awards={[{ ...base, year: '2015', title: '—' }, { ...base, year: '2021' }]} kicker="k" title="t" labels={{ won: 'Vencedor', nominated: 'Indicado' }} />)
        const anos = screen.getAllByText(/^20\d\d$/).map(e => e.textContent)
        expect(anos).toEqual(['2021', '2015'])
        expect(screen.queryByText('—')).toBeNull()
    })
})

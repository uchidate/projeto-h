// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArtistFilmography } from './ArtistFilmography'
import type { WPProduction } from '@/lib/wordpress/types'

// jsdom não processa CSS (sm:hidden/hidden do Tailwind), então a tabela
// desktop e a lista mobile ficam as DUAS presentes no DOM ao mesmo tempo —
// por isso os testes usam getAllByText/getAllByRole e checam o length.

function production(id: number, overrides: Partial<WPProduction['acf']> = {}): WPProduction {
    return {
        id, slug: `p${id}`, title: { rendered: `Produção ${id}` }, date: '2020-01-01T00:00:00',
        acf: { type: 'drama', ...overrides },
    } as WPProduction
}

describe('ArtistFilmography', () => {
    it('não renderiza nada quando não há produções', () => {
        const { container } = render(<ArtistFilmography productions={[]} label="Atriz" accent="#e91e8c" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('não mostra o botão "ver mais" quando há 10 ou menos produções', () => {
        const productions = Array.from({ length: 10 }, (_, i) => production(i))
        render(<ArtistFilmography productions={productions} label="Atriz" accent="#e91e8c" />)
        expect(screen.queryByRole('button', { name: /ver todos/i })).not.toBeInTheDocument()
    })

    it('trunca em 10 e mostra "Ver todos os N trabalhos" quando há mais de 10', () => {
        const productions = Array.from({ length: 15 }, (_, i) => production(i))
        render(<ArtistFilmography productions={productions} label="Atriz" accent="#e91e8c" />)
        expect(screen.getByRole('button', { name: /ver todos os 15 trabalhos/i })).toBeInTheDocument()
        expect(screen.queryAllByText('Produção 10')).toHaveLength(0) // 11º item (índice 10) não deveria aparecer
    })

    it('clicar em "Ver todos" expande e mostra os itens restantes', async () => {
        const productions = Array.from({ length: 15 }, (_, i) => production(i))
        const user = userEvent.setup()
        render(<ArtistFilmography productions={productions} label="Atriz" accent="#e91e8c" />)
        await user.click(screen.getByRole('button', { name: /ver todos os 15 trabalhos/i }))
        expect(screen.getAllByText('Produção 14').length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: /mostrar menos/i })).toBeInTheDocument()
    })

    it('clicar em "Mostrar menos" volta a truncar', async () => {
        const productions = Array.from({ length: 15 }, (_, i) => production(i))
        const user = userEvent.setup()
        render(<ArtistFilmography productions={productions} label="Atriz" accent="#e91e8c" />)
        await user.click(screen.getByRole('button', { name: /ver todos os 15 trabalhos/i }))
        await user.click(screen.getByRole('button', { name: /mostrar menos/i }))
        expect(screen.getByRole('button', { name: /ver todos os 15 trabalhos/i })).toBeInTheDocument()
    })

    it('usa o ano de acf.year quando presente, senão cai pro release_date/date', () => {
        const withYear = production(1, { year: 2019 })
        const withoutYear = production(2, {})
        withoutYear.date = '2021-03-01T00:00:00'
        render(<ArtistFilmography productions={[withYear, withoutYear]} label="Atriz" accent="#e91e8c" />)
        expect(screen.getAllByText('2019').length).toBeGreaterThan(0)
        expect(screen.getAllByText('2021').length).toBeGreaterThan(0)
    })

    it('mostra "-" (desktop) quando não há rating', () => {
        const prod = production(1, { rating: undefined })
        render(<ArtistFilmography productions={[prod]} label="Atriz" accent="#e91e8c" />)
        // coluna de rating na tabela desktop mostra "-" quando rating é 0/ausente
        expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })

    it('mostra o rating formatado com 1 casa decimal quando presente', () => {
        const prod = production(1, { rating: 8.567 })
        render(<ArtistFilmography productions={[prod]} label="Atriz" accent="#e91e8c" />)
        expect(screen.getAllByText('8.6').length).toBeGreaterThan(0)
    })

    it('mapeia o tipo pro label em português, com "Série" como default', () => {
        const movie = production(1, { type: 'movie' })
        const unknown = production(2, { type: 'formato-desconhecido' as unknown as 'drama' })
        render(<ArtistFilmography productions={[movie, unknown]} label="Atriz" accent="#e91e8c" />)
        expect(screen.getAllByText('Filme').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Série').length).toBeGreaterThan(0)
    })
})

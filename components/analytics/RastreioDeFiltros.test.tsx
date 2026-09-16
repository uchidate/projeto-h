// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { trackFiltroListagem, params } = vi.hoisted(() => ({ trackFiltroListagem: vi.fn(), params: { atual: new URLSearchParams() } }))
vi.mock('@/lib/analytics', () => ({ trackFiltroListagem }))
vi.mock('next/navigation', () => ({ useSearchParams: () => params.atual }))

import { RastreioDeFiltros } from './RastreioDeFiltros'

const FILTROS = ['genre', 'page'] as const

describe('RastreioDeFiltros', () => {
    beforeEach(() => { trackFiltroListagem.mockClear(); params.atual = new URLSearchParams() })

    it('listagem sem filtro na entrada não gera evento (a pageview já conta)', () => {
        render(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        expect(trackFiltroListagem).not.toHaveBeenCalled()
    })

    it('chegar já filtrado é origem "entrada"', () => {
        params.atual = new URLSearchParams('genre=romance')
        render(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        expect(trackFiltroListagem).toHaveBeenCalledWith({ listagem: 'producoes', filtros: 'genre=romance', origem: 'entrada' })
    })

    it('filtrar depois de entrar é origem "interacao"', () => {
        const { rerender } = render(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        params.atual = new URLSearchParams('genre=acao&page=2')
        rerender(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        expect(trackFiltroListagem).toHaveBeenCalledWith({ listagem: 'producoes', filtros: 'genre=acao&page=2', origem: 'interacao' })
    })

    it('ignora parâmetro que não é filtro (utm) e não repete o mesmo estado', () => {
        params.atual = new URLSearchParams('utm_source=instagram')
        const { rerender } = render(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        rerender(<RastreioDeFiltros listagem="producoes" filtros={FILTROS} />)
        expect(trackFiltroListagem).not.toHaveBeenCalled()
    })
})

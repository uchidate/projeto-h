// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupDiscography, type DiscographyAlbum } from './GroupDiscography'

function album(overrides: Partial<DiscographyAlbum> = {}): DiscographyAlbum {
    return {
        id: 'a1', title: 'Album 1', type: 'ALBUM', releaseYear: 2020,
        coverUrl: null, spotifyUrl: 'https://spotify.com/a1', tracks: [],
        ...overrides,
    }
}

function track(id: string, trackNumber: number, durationMs = 210000) {
    return { id, title: `Faixa ${trackNumber}`, trackNumber, durationMs, spotifyUrl: `https://spotify.com/${id}` }
}

describe('GroupDiscography', () => {
    it('não renderiza nada quando não há álbuns', () => {
        const { container } = render(<GroupDiscography albums={[]} accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra a contagem total de lançamentos', () => {
        render(<GroupDiscography albums={[album(), album({ id: 'a2' })]} accent="#000" />)
        expect(screen.getByText('2 lançamentos')).toBeInTheDocument()
    })

    it('usa singular quando há só 1 lançamento', () => {
        render(<GroupDiscography albums={[album()]} accent="#000" />)
        expect(screen.getByText('1 lançamento')).toBeInTheDocument()
    })

    it('não mostra a aba de um tipo sem nenhum álbum (ex: sem EP)', () => {
        render(<GroupDiscography albums={[album({ type: 'ALBUM' }), album({ id: 'a2', type: 'SINGLE' })]} accent="#000" />)
        expect(screen.queryByRole('button', { name: /eps/i })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /álbuns/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /singles/i })).toBeInTheDocument()
    })

    it('clicar numa aba filtra os álbuns mostrados', async () => {
        const user = userEvent.setup()
        render(<GroupDiscography albums={[
            album({ id: 'a1', title: 'Meu Álbum', type: 'ALBUM' }),
            album({ id: 's1', title: 'Meu Single', type: 'SINGLE' }),
        ]} accent="#000" />)
        expect(screen.getByText('Meu Álbum')).toBeInTheDocument()
        expect(screen.getByText('Meu Single')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^singles/i }))
        expect(screen.queryByText('Meu Álbum')).not.toBeInTheDocument()
        expect(screen.getByText('Meu Single')).toBeInTheDocument()
    })

    it('alterna entre visão grade e lista', async () => {
        const user = userEvent.setup()
        render(<GroupDiscography albums={[album({ tracks: [track('t1', 1)] })]} accent="#000" />)
        // grade não mostra faixas individuais
        expect(screen.queryByText('Faixa 1')).not.toBeInTheDocument()

        await user.click(screen.getByTitle('Lista'))
        expect(screen.getByText('Faixa 1')).toBeInTheDocument()
    })

    it('trunca em 4 faixas e mostra "N faixas a mais"', async () => {
        const tracks = Array.from({ length: 7 }, (_, i) => track(`t${i}`, i + 1))
        const user = userEvent.setup()
        render(<GroupDiscography albums={[album({ tracks })]} accent="#000" />)
        await user.click(screen.getByTitle('Lista'))

        expect(screen.getByText('Faixa 4')).toBeInTheDocument()
        expect(screen.queryByText('Faixa 5')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /3 faixas a mais/i })).toBeInTheDocument()
    })

    it('expandir mostra todas as faixas; recolher volta a truncar', async () => {
        const tracks = Array.from({ length: 7 }, (_, i) => track(`t${i}`, i + 1))
        const user = userEvent.setup()
        render(<GroupDiscography albums={[album({ tracks })]} accent="#000" />)
        await user.click(screen.getByTitle('Lista'))
        await user.click(screen.getByRole('button', { name: /faixas a mais/i }))

        expect(screen.getByText('Faixa 7')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /menos/i })).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /menos/i }))
        expect(screen.queryByText('Faixa 7')).not.toBeInTheDocument()
    })

    it('expandir um álbum não afeta o estado de outro álbum (Set independente por id)', async () => {
        const tracksA = Array.from({ length: 6 }, (_, i) => track(`a-t${i}`, i + 1))
        const tracksB = Array.from({ length: 6 }, (_, i) => track(`b-t${i}`, i + 1))
        const user = userEvent.setup()
        render(<GroupDiscography albums={[
            album({ id: 'album-a', title: 'Album A', tracks: tracksA }),
            album({ id: 'album-b', title: 'Album B', tracks: tracksB }),
        ]} accent="#000" />)
        await user.click(screen.getByTitle('Lista'))

        const expandButtons = screen.getAllByRole('button', { name: /faixas a mais/i })
        await user.click(expandButtons[0]) // expande só o álbum A

        expect(screen.getByRole('button', { name: /menos/i })).toBeInTheDocument() // A expandido
        expect(screen.getAllByRole('button', { name: /faixas a mais/i })).toHaveLength(1) // B continua truncado
    })

    it('formata a duração da faixa em minutos:segundos', async () => {
        const user = userEvent.setup()
        render(<GroupDiscography albums={[album({ tracks: [track('t1', 1, 195000)] })]} accent="#000" />)
        await user.click(screen.getByTitle('Lista'))
        expect(screen.getByText('3:15')).toBeInTheDocument()
    })
})

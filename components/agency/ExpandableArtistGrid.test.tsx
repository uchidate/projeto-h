// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpandableArtistGrid } from './ExpandableArtistGrid'
import type { WPArtist } from '@/lib/wordpress/types'

function artist(id: number, name: string): WPArtist {
    return { id, slug: `artist-${id}`, title: { rendered: name }, acf: {} } as WPArtist
}

describe('ExpandableArtistGrid', () => {
    it('mostra todos os artistas quando o total é menor que initialCount', () => {
        const artists = [artist(1, 'A'), artist(2, 'B'), artist(3, 'C')]
        render(<ExpandableArtistGrid artists={artists} accent="#000" initialCount={16} />)
        expect(screen.getAllByRole('link')).toHaveLength(3)
    })

    it('não mostra o botão "Ver mais" quando não há mais artistas além do initialCount', () => {
        const artists = [artist(1, 'A'), artist(2, 'B')]
        render(<ExpandableArtistGrid artists={artists} accent="#000" initialCount={16} />)
        expect(screen.queryByRole('button', { name: /ver mais/i })).not.toBeInTheDocument()
    })

    it('trunca a exibição em initialCount e mostra "Ver mais N artistas"', () => {
        const artists = Array.from({ length: 20 }, (_, i) => artist(i, `Artista ${i}`))
        render(<ExpandableArtistGrid artists={artists} accent="#000" initialCount={16} />)
        expect(screen.getAllByRole('link')).toHaveLength(16)
        expect(screen.getByRole('button', { name: /ver mais 4 artistas/i })).toBeInTheDocument()
    })

    it('clicar em "Ver mais" mostra todos os artistas e esconde o botão', async () => {
        const artists = Array.from({ length: 20 }, (_, i) => artist(i, `Artista ${i}`))
        const user = userEvent.setup()
        render(<ExpandableArtistGrid artists={artists} accent="#000" initialCount={16} />)

        await user.click(screen.getByRole('button', { name: /ver mais/i }))

        expect(screen.getAllByRole('link')).toHaveLength(20)
        expect(screen.queryByRole('button', { name: /ver mais/i })).not.toBeInTheDocument()
    })

    it('usa 16 como initialCount default quando não especificado', () => {
        const artists = Array.from({ length: 18 }, (_, i) => artist(i, `Artista ${i}`))
        render(<ExpandableArtistGrid artists={artists} accent="#000" />)
        expect(screen.getAllByRole('link')).toHaveLength(16)
    })

    it('renderiza o nome_hangul quando presente no ACF', () => {
        const a = artist(1, 'Jimin')
        a.acf = { name_hangul: '지민' }
        render(<ExpandableArtistGrid artists={[a]} accent="#000" />)
        expect(screen.getByText('지민')).toBeInTheDocument()
    })

    it('lida com lista vazia sem quebrar', () => {
        render(<ExpandableArtistGrid artists={[]} accent="#000" />)
        expect(screen.queryAllByRole('link')).toHaveLength(0)
        expect(screen.queryByRole('button', { name: /ver mais/i })).not.toBeInTheDocument()
    })
})

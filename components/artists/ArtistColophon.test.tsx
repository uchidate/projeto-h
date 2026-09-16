// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArtistColophon } from './ArtistColophon'
import type { WPArtist } from '@/lib/wordpress/types'

function artist(acf: Record<string, unknown>, modified = '2026-07-23T08:38:17'): WPArtist {
    return { id: 1, slug: 'x', modified, title: { rendered: 'X' }, content: { rendered: '' }, acf } as unknown as WPArtist
}

const chapter = (source_url: string) => ({ period: '', title: '', description: '', source_url })
const metric = (source_url: string) => ({ value: '', label: '', source_url })

describe('ArtistColophon', () => {
    it('conta referências e veículos distintos, ignorando www', () => {
        render(<ArtistColophon name="X" accent="#000" artist={artist({
            story_chapters: [chapter('https://www.billboard.com/a'), chapter('https://billboard.com/b')],
            key_metrics: [metric('https://forbes.com/c')],
        })} />)
        expect(screen.getByText(/3 referências · 2 veículos/)).toBeInTheDocument()
    })

    it('usa singular quando há uma só referência', () => {
        render(<ArtistColophon name="X" accent="#000" artist={artist({
            key_metrics: [metric('https://nme.com/a')],
        })} />)
        expect(screen.getByText(/1 referência · 1 veículo/)).toBeInTheDocument()
    })

    it('não quebra nem infla a contagem com URL malformada no CMS', () => {
        render(<ArtistColophon name="X" accent="#000" artist={artist({
            key_metrics: [metric('não é uma url'), metric('https://soompi.com/a')],
        })} />)
        expect(screen.getByText(/2 referências · 1 veículo/)).toBeInTheDocument()
    })

    it('omite o bloco de fontes quando o perfil não cita nenhuma', () => {
        render(<ArtistColophon name="X" accent="#000" artist={artist({})} />)
        expect(screen.queryByText(/refer[êe]ncia/)).not.toBeInTheDocument()
        expect(screen.getByText(/23 de jul\. de 2026/)).toBeInTheDocument()
    })

    it('não renderiza nada sem data de revisão nem fontes', () => {
        const { container } = render(<ArtistColophon name="X" accent="#000" artist={artist({}, '')} />)
        expect(container).toBeEmptyDOMElement()
    })
})

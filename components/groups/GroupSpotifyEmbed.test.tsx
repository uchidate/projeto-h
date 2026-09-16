// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupSpotifyEmbed } from './GroupSpotifyEmbed'

describe('GroupSpotifyEmbed', () => {
    it('não renderiza nada quando a URL não é do Spotify', () => {
        const { container } = render(<GroupSpotifyEmbed spotifyUrl="https://example.com/x" name="BTS" accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada com URL inválida', () => {
        const { container } = render(<GroupSpotifyEmbed spotifyUrl="não-é-url" name="BTS" accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('converte a URL do Spotify pro formato embed no src do iframe', () => {
        render(<GroupSpotifyEmbed spotifyUrl="https://open.spotify.com/artist/123" name="BTS" accent="#000" />)
        const iframe = screen.getByTitle('BTS no Spotify')
        expect(iframe).toHaveAttribute('src', 'https://open.spotify.com/embed/artist/123?utm_source=generator&theme=0')
    })

    it('linka "Abrir no Spotify" pra URL original (não a embed)', () => {
        render(<GroupSpotifyEmbed spotifyUrl="https://open.spotify.com/artist/123" name="BTS" accent="#000" />)
        expect(screen.getByRole('link', { name: /abrir no spotify/i })).toHaveAttribute('href', 'https://open.spotify.com/artist/123')
    })

    it('mostra overlay de carregamento antes do iframe disparar onLoad', () => {
        render(<GroupSpotifyEmbed spotifyUrl="https://open.spotify.com/artist/123" name="BTS" accent="#000" />)
        expect(screen.getByText(/carregando bts no spotify/i)).toBeInTheDocument()
    })

    it('esconde o overlay de carregamento após o iframe disparar onLoad', () => {
        render(<GroupSpotifyEmbed spotifyUrl="https://open.spotify.com/artist/123" name="BTS" accent="#000" />)
        fireEvent.load(screen.getByTitle('BTS no Spotify'))
        expect(screen.queryByText(/carregando bts no spotify/i)).not.toBeInTheDocument()
    })
})

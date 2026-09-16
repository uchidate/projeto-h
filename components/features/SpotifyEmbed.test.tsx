// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpotifyEmbed } from './SpotifyEmbed'

describe('SpotifyEmbed', () => {
    it('converte a URL do Spotify pro formato embed com utm_source', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" />)
        expect(screen.getByTitle('Spotify')).toHaveAttribute(
            'src',
            'https://open.spotify.com/embed/track/abc123?utm_source=generator&theme=0',
        )
    })

    it('usa "Spotify — {title}" quando title é passado', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" title="Dynamite" />)
        expect(screen.getByTitle('Spotify — Dynamite')).toBeInTheDocument()
    })

    it('usa altura compacta (152) quando compact=true', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" compact />)
        expect(screen.getByTitle('Spotify')).toHaveAttribute('height', '152')
    })

    it('usa altura padrão (352) quando compact não é passado', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" />)
        expect(screen.getByTitle('Spotify')).toHaveAttribute('height', '352')
    })

    it('esconde o iframe (display none) e mostra skeleton antes de carregar', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" />)
        expect(screen.getByTitle('Spotify')).toHaveStyle({ display: 'none' })
    })

    it('mostra o iframe após onLoad disparar', () => {
        render(<SpotifyEmbed spotifyUrl="https://open.spotify.com/track/abc123" />)
        const iframe = screen.getByTitle('Spotify')
        fireEvent.load(iframe)
        expect(iframe).toHaveStyle({ display: 'block' })
    })
})

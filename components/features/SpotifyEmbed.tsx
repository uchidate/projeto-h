'use client'

import { useState } from 'react'

interface SpotifyEmbedProps {
    spotifyUrl: string
    title?: string
    compact?: boolean
}

export function SpotifyEmbed({ spotifyUrl, title, compact = false }: SpotifyEmbedProps) {
    const [loaded, setLoaded] = useState(false)

    const embedUrl = spotifyUrl.replace(
        'https://open.spotify.com/',
        'https://open.spotify.com/embed/'
    ) + '?utm_source=generator&theme=0'

    const height = compact ? 152 : 352

    return (
        <div className="spotify-embed" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            {!loaded && (
                <div
                    style={{ height, background: 'var(--color-surface)', borderRadius: '12px' }}
                    className="animate-pulse"
                    aria-hidden="true"
                />
            )}
            <iframe
                src={embedUrl}
                width="100%"
                height={height}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={title ? `Spotify — ${title}` : 'Spotify'}
                onLoad={() => setLoaded(true)}
                style={{ display: loaded ? 'block' : 'none', borderRadius: '12px' }}
            />
        </div>
    )
}

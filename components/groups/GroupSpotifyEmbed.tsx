'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { Music, ExternalLink } from 'lucide-react'
import { toSpotifyEmbedUrl } from '@/lib/utils'
import { BlockHeader } from '@/components/blocks/BlockHeader'

interface Props {
    spotifyUrl: string
    name: string
    accent: string
}

export function GroupSpotifyEmbed({ spotifyUrl, name, accent }: Props) {
    const tc = useTranslations('client')
    const [loaded, setLoaded] = useState(false)
    const embedUrl = toSpotifyEmbedUrl(spotifyUrl)
    if (!embedUrl) return null

    return (
        <section id="spotify">
            <BlockHeader title="Spotify" eyebrow={tc('common.dossier')} tone="muted"
                icon={<Music className="h-4 w-4 text-green-500" />}
                action={<a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 hover:text-green-400 transition-colors">
                    {tc('spotify.open')}
                    <ExternalLink className="h-3 w-3" />
                </a>} />
            {/* Moldura em fio neutro: o verde fica no ícone e no link, onde
                identifica a marca, e não como caixa colorida competindo com o
                accent do perfil. */}
            <div className="relative overflow-hidden border border-border bg-black"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center">
                            <Music className="mx-auto mb-2 h-8 w-8 text-green-500 animate-pulse" />
                            <p className="text-xs text-muted">Carregando {name} no Spotify…</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="352"
                    className="h-[352px] w-full"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    title={tc('spotify.onSpotify', { name })}
                />
            </div>
        </section>
    )
}

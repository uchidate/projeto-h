'use client'

import { useTranslations } from 'next-intl'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, ExternalLink, LayoutGrid, List, Music, Play } from 'lucide-react'
import { BlockHeader } from '@/components/blocks/BlockHeader'

export interface DiscographyAlbum {
    id: string
    title: string
    type: 'ALBUM' | 'EP' | 'SINGLE' | 'COMPILATION'
    releaseYear: number | null
    coverUrl: string | null
    spotifyUrl: string
    tracks: { id: string; title: string; trackNumber: number; durationMs: number; spotifyUrl: string }[]
}

interface Props {
    albums: DiscographyAlbum[]
    accent: string
}

type Tab = 'all' | 'ALBUM' | 'EP' | 'SINGLE'

const TYPE_LABEL: Record<string, string> = { ALBUM: 'Álbum', EP: 'EP', SINGLE: 'Single', COMPILATION: 'Coletânea' }

function formatDuration(ms: number): string {
    const s = Math.round(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function GroupDiscography({ albums, accent }: Props) {
    const tc = useTranslations('client')
    const [tab, setTab] = useState<Tab>('all')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [view, setView] = useState<'grid' | 'list'>('grid')

    const counts = useMemo(() => ({
        ALBUM: albums.filter(a => a.type === 'ALBUM').length,
        EP: albums.filter(a => a.type === 'EP').length,
        SINGLE: albums.filter(a => a.type === 'SINGLE').length,
    }), [albums])

    const filtered = tab === 'all' ? albums : albums.filter(a => a.type === tab)

    const allTabs: { key: Tab; label: string; count: number }[] = [
        { key: 'all', label: tc('discography.all'), count: albums.length },
        { key: 'ALBUM', label: tc('discography.albums'), count: counts.ALBUM },
        { key: 'EP', label: 'EPs', count: counts.EP },
        { key: 'SINGLE', label: 'Singles', count: counts.SINGLE },
    ]
    const tabs = allTabs.filter(t => t.key === 'all' || t.count > 0)

    if (albums.length === 0) return null

    return (
        <section id="discografia">
            <BlockHeader title={tc('discography.title')} eyebrow={tc('common.dossier')} tone="muted"
                icon={<Music className="h-4 w-4" style={{ color: accent }} />}
                action={<div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center border border-border">
                        <button type="button" title={tc('discography.grid')} onClick={() => setView('grid')}
                            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-surface text-foreground' : 'text-muted hover:text-foreground'}`}>
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" title={tc('discography.list')} onClick={() => setView('list')}
                            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-surface text-foreground' : 'text-muted hover:text-foreground'}`}>
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <p className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted">
                        {albums.length} lançamento{albums.length !== 1 ? 's' : ''}
                    </p>
                </div>} />

            {/* Filter tabs */}
            {tabs.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                    {tabs.map(t => (
                        <button type="button" key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`touch-target px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.08em] border transition-colors ${tab === t.key ? '' : 'border-border text-muted hover:text-foreground'}`}
                            style={tab === t.key ? { background: accent, borderColor: accent, color: '#fff' } : undefined}>
                            {t.label}
                            {t.key !== 'all' && <span className="ml-1 opacity-70">({t.count})</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid view */}
            {view === 'grid' && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                    {filtered.map(album => (
                        <div key={album.id} className="group border border-border bg-background">
                            <div className="relative aspect-square overflow-hidden bg-surface">
                                {album.coverUrl ? (
                                    <Image src={album.coverUrl} alt={album.title} fill sizes="(max-width: 640px) 33vw, 20vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" unoptimized />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Music className="h-6 w-6 text-muted/40" />
                                    </div>
                                )}
                                <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
                                    title={tc('spotify.listen')}>
                                    <div className="flex h-10 w-10 items-center justify-center bg-[#1DB954] shadow-lg">
                                        <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                                    </div>
                                </a>
                            </div>
                            <div className="p-2">
                                <p className="text-xs font-bold leading-snug line-clamp-1">{album.title}</p>
                                <p className="mt-0.5 font-mono text-[10px] text-muted">
                                    {TYPE_LABEL[album.type]}{album.releaseYear ? ` · ${album.releaseYear}` : ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List view */}
            {view === 'list' && (
                <div className="space-y-3">
                    {filtered.map(album => {
                        const isExpanded = expanded.has(album.id)
                        const visible = isExpanded ? album.tracks : album.tracks.slice(0, 4)
                        const remaining = album.tracks.length - 4
                        return (
                            <article key={album.id} className="overflow-hidden border border-border bg-background">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="relative aspect-square w-full shrink-0 bg-surface sm:aspect-auto sm:min-h-32 sm:w-32">
                                        {album.coverUrl ? (
                                            <Image src={album.coverUrl} alt={album.title} fill
                                                sizes="(max-width: 640px) 100vw, 128px"
                                                className="object-cover" unoptimized />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Music className="h-7 w-7 text-muted/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 p-4">
                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase leading-4 text-white"
                                                style={{ background: accent }}>
                                                {TYPE_LABEL[album.type]}
                                            </span>
                                            {album.releaseYear && (
                                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {album.releaseYear}
                                                </span>
                                            )}
                                            {album.tracks.length > 0 && (
                                                <span className="font-mono text-[10px] text-muted">
                                                    {album.tracks.length} faixa{album.tracks.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                                className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#1DB954] hover:underline">
                                                <Play className="h-3 w-3" /> Spotify
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        </div>
                                        <h4 className="text-base font-bold leading-snug">{album.title}</h4>

                                        {album.tracks.length > 0 && (
                                            <div className="mt-3 border-t border-border pt-2.5 space-y-0.5">
                                                {visible.map(track => (
                                                    <div key={track.id}
                                                        className="grid grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-2 py-1 text-sm">
                                                        <span className="font-mono text-[10px] text-muted text-right tabular-nums">
                                                            {track.trackNumber}
                                                        </span>
                                                        <span className="truncate text-[13px]">{track.title}</span>
                                                        <span className="font-mono text-[10px] text-muted tabular-nums">
                                                            {formatDuration(track.durationMs)}
                                                        </span>
                                                        <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                                            title={tc('spotify.listenTrack', { track: track.title })}
                                                            className="text-[#1DB954] hover:text-[#1ed760]">
                                                            <Play className="h-3 w-3 fill-current" />
                                                        </a>
                                                    </div>
                                                ))}
                                                {album.tracks.length > 4 && (
                                                    <button type="button"
                                                        onClick={() => setExpanded(prev => {
                                                            const next = new Set(prev)
                                                            if (isExpanded) next.delete(album.id)
                                                            else next.add(album.id)
                                                            return next
                                                        })}
                                                        className="mt-1.5 font-mono text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-wider">
                                                        {isExpanded ? tc('discography.less') : tc('discography.more', { count: remaining })}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

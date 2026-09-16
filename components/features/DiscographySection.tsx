import Link from 'next/link'
import Image from 'next/image'
import type { MusicRelease } from '@/lib/wordpress/music'

const TYPE_LABELS: Record<string, string> = {
    album: 'Álbum',
    ep: 'EP',
    single: 'Single',
    compilation: 'Coletânea',
}

function releaseYear(dateStr: string | null) {
    if (!dateStr) return null
    return dateStr.slice(0, 4)
}

interface DiscographySectionProps {
    releases: MusicRelease[]
    title?: string
}

export function DiscographySection({ releases, title = 'Discografia' }: DiscographySectionProps) {
    if (!releases.length) return null

    const grouped = releases.reduce<Record<string, MusicRelease[]>>((acc, r) => {
        const type = r.release_type ?? 'single'
        if (!acc[type]) acc[type] = []
        acc[type].push(r)
        return acc
    }, {})

    const order = ['album', 'ep', 'single', 'compilation']
    const types = order.filter(t => grouped[t]?.length)

    return (
        <section className="discography-section mt-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-(--color-border)">
                {title}
            </h2>

            {types.map(type => (
                <div key={type} className="mb-6">
                    <h3 className="text-sm font-semibold text-(--color-muted) uppercase tracking-wider mb-3">
                        {TYPE_LABELS[type] ?? type}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {grouped[type].map(release => (
                            <ReleaseCard key={release.id} release={release} />
                        ))}
                    </div>
                </div>
            ))}
        </section>
    )
}

function ReleaseCard({ release }: { release: MusicRelease }) {
    const year = releaseYear(release.release_date)
    const content = (
        <div className="group flex flex-col gap-1">
            <div className="relative aspect-square rounded-md overflow-hidden bg-(--color-surface)">
                {release.cover_url ? (
                    <Image
                        src={release.cover_url}
                        alt={release.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-(--color-muted)">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                    </div>
                )}
            </div>
            <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-(--color-accent) transition-colors">
                {release.title}
            </p>
            {year && (
                <p className="text-xs text-(--color-muted)">{year}</p>
            )}
        </div>
    )

    if (release.spotify_url) {
        return (
            <Link href={release.spotify_url} target="_blank" rel="noopener noreferrer">
                {content}
            </Link>
        )
    }
    return content
}

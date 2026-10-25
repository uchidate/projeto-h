import type { WPArtist } from '@/lib/wordpress/types'
import { ArtistCard } from '@/components/artists/ArtistCard'

const MONO = 'font-mono text-[11px] font-black uppercase tracking-[0.18em]'

/** Faixa "Em destaque" dos guias por categoria (cantoras, atores, idols): quem tem mais peso no catálogo vem antes da lista alfabética. */
export function DestaquesDaCategoria({ artists, rotulo }: { artists: WPArtist[]; rotulo: string }) {
    if (artists.length === 0) return null
    return (
        <section aria-label={`Em destaque: ${rotulo}`} className="space-y-4">
            <div className="flex items-center gap-3">
                <span aria-hidden className="h-3 w-3 shrink-0 bg-accent" />
                <h2 className={`whitespace-nowrap text-foreground ${MONO}`}>{`Em destaque · ${artists.length}`}</h2>
                <span aria-hidden className="h-0.5 min-w-4 flex-1 bg-accent opacity-35" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {artists.map((a, i) => <ArtistCard key={a.id} artist={a} priority={i < 6} />)}
            </div>
        </section>
    )
}

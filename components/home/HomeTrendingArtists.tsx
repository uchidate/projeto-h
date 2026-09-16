import { SITE_NAME } from '@/lib/constants/site'
import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { nameToGradient } from '@/lib/home/catStyle'

const ROLE_PT: Record<string, string> = {
    singer: 'Cantor(a)', actor: 'Ator/Atriz', dancer: 'Dançarino(a)',
    rapper: 'Rapper', model: 'Modelo',
}

interface Props {
    artists: WPArtist[]
    featuredArtist?: WPArtist | null
    featuredArtistNote?: string
}

export function HomeTrendingArtists({ artists, featuredArtist, featuredArtistNote }: Props) {
    const spotlight = featuredArtist ?? artists[0]
    return (
        <aside className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">● ranking do site</p>
                </div>
                <h2 className="font-sans text-[15px] font-black tracking-[-0.02em] text-foreground mt-0.5">Mais buscados no {SITE_NAME}</h2>
                <p className="mt-1 text-[11px] text-muted leading-snug">Artistas com mais acessos e buscas aqui no site</p>
            </div>
            <div>
                {artists.map((artist, index) => {
                    const image = getWPImage(artist._embedded, artist.featured_image_url)
                    const name = stripHtml(artist.title.rendered)
                    const acf = artist.acf ?? {}
                    const roles = (acf.roles as string[] | undefined)
                        ?.slice(0, 2).map(r => ROLE_PT[r] ?? r).join(', ')
                    return (
                        <Link key={artist.id} href={`/artists/${artist.slug}`}
                            className={`grid-cols-[42px_44px_minmax(0,1fr)] items-center gap-3 border-b border-border py-3 transition-colors last:border-b-0 hover:bg-background/70 ${index >= 5 ? 'hidden lg:grid' : 'grid'}`}>
                            <span className={`font-serif text-[32px] leading-none ${index < 3 ? 'text-accent' : 'text-muted/45'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={`relative h-11 w-11 overflow-hidden rounded-full border bg-surface ${index < 3 ? 'border-accent/40 ring-2 ring-accent/20 ring-offset-1 ring-offset-background' : 'border-border'}`}
                                style={{ background: nameToGradient(name) }}>
                                {image ? (
                                    <Image src={image.src} alt={name} fill sizes="44px" className="object-cover object-top" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-white">
                                        {name.slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-foreground">{name}</span>
                                {roles && <span className="mt-0.5 block truncate text-[11px] text-muted">{roles}</span>}
                            </span>
                        </Link>
                    )
                })}
            </div>
            {spotlight && (() => {
                const name = stripHtml(spotlight.title.rendered)
                const image = getWPImage(spotlight._embedded, spotlight.featured_image_url)
                const isGroup = !spotlight.acf?.roles
                const href = isGroup ? `/groups/${spotlight.slug}` : `/artists/${spotlight.slug}`
                const sub = featuredArtistNote || spotlight.acf?.name_hangul || spotlight.acf?.roles?.[0] || 'Perfil em foco'
                const isCurated = !!featuredArtist
                return (
                    <Link href={href}
                        className="group mt-6 flex overflow-hidden border border-foreground bg-foreground text-background transition-opacity hover:opacity-95">
                        <div className="flex flex-1 flex-col justify-center p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-a11y">
                                {isCurated ? 'Escolha editorial' : 'Destaque da semana'}
                            </p>
                            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] leading-tight">{name}</h3>
                            <p className="mt-1 text-xs text-background/65">{sub}</p>
                        </div>
                        {image && (
                            <div className="relative w-28 shrink-0 overflow-hidden">
                                <Image src={image.src} alt={name} fill sizes="112px"
                                    className="object-cover object-top" />
                            </div>
                        )}
                    </Link>
                )
            })()}
            <Link href="/artists" className="mt-4 flex items-center justify-between border border-border bg-surface px-4 py-3 hover:border-accent/40 transition-colors group">
                <span className="text-[13px] font-black text-foreground group-hover:text-accent transition-colors">Ver todos os artistas</span>
                <span className="text-accent font-mono font-black transition-transform group-hover:translate-x-1">→</span>
            </Link>
        </aside>
    )
}

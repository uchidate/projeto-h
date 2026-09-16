import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
    cast: WPArtist[]
    details?: Array<{ slug: string; role: string }>
}

export function ProductionCast({ cast, details = [] }: Props) {
    if (!cast.length) return null
    const roles = new Map(details.map(item => [item.slug, item.role]))
    return (
        <div className="mt-10">
            <div className="flex items-baseline justify-between mb-5">
                <h2 className="text-[18px] font-black">Elenco</h2>
                <span className="font-mono text-[11px] text-muted">{cast.length} artistas</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {cast.map((artist, index) => {
                    const image = getWPImage(artist._embedded, artist.featured_image_url)
                    const name = stripHtml(artist.title.rendered)
                    const role = roles.get(artist.slug)
                    return (
                        <Link key={artist.id} href={`/artists/${artist.slug}`}
                            className="group grid grid-cols-[76px_minmax(0,1fr)] overflow-hidden border border-border bg-background transition-colors hover:border-accent/40 sm:block">
                            <div className="relative aspect-3/4 overflow-hidden bg-surface">
                                {image ? (
                                    <Image src={image.src} alt={image.alt || name} fill
                                        sizes="(max-width: 640px) 76px, 25vw"
                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[28px] font-black text-accent/30">{name[0]}</div>
                                )}
                                <span className="absolute left-2 top-2 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-black text-white/80">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="absolute inset-0 hidden bg-linear-to-t from-black/75 via-transparent to-transparent sm:block" />
                                <div className="absolute inset-x-3 bottom-3 hidden sm:block">
                                    <p className="truncate text-[13px] font-black text-white">{name}</p>
                                    {role && <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-white/70">{role}</p>}
                                </div>
                            </div>
                            <div className="flex min-w-0 flex-col justify-center px-3 py-2 sm:hidden">
                                <p className="truncate text-[14px] font-black group-hover:text-accent">{name}</p>
                                {artist.acf?.name_hangul && <p className="mt-0.5 font-mono text-[10px] text-muted">{artist.acf.name_hangul}</p>}
                                {role && (
                                    <div className="mt-2">
                                        <p className="font-mono text-[8px] font-black uppercase tracking-widest text-muted">Personagem</p>
                                        <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold">{role}</p>
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

import { useLocale } from 'next-intl'
import { labelsFor } from '@/lib/i18n/labels'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Film, Tv } from 'lucide-react'
import type { WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    production: WPProduction
    priority?: boolean
    sizes?: string
    aspectRatio?: string
    variant?: 'default' | 'catalog'
    genreMap?: Record<number, string>
}

const SERIF = 'font-[family-name:var(--font-playfair)]'

/** Valores que o WordPress grava no lugar de "sem rede". */
const SEM_VALOR = /^(none|null|n\/?a|-|—)?$/i

/**
 * Gancho do cartão de catálogo: os dois primeiros nomes do elenco principal e a rede/plataforma.
 * Só dados já presentes na listagem; sem elenco não há gancho.
 */
export function ganchoProducao(acf: WPProduction['acf'] | undefined): { elenco: string; rede?: string; noAr: boolean } | null {
    const elenco = String(acf?.main_cast ?? '').split(',').map(n => n.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean).slice(0, 2).join(', ')
    if (!elenco) return null
    const rede = String(acf?.network ?? '').trim()
    return { elenco, rede: SEM_VALOR.test(rede) ? undefined : rede, noAr: ['airing', 'ongoing'].includes(String(acf?.status_production)) }
}

export function ProductionCard({ production, priority, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw', aspectRatio = 'aspect-2/3', variant = 'default', genreMap = {} }: Props) {
    const labels = labelsFor(useLocale())
    const image = getWPImage(production._embedded, production.featured_image_url)
    const title = stripHtml(production.title.rendered)
    const acf = production.acf ?? {}

    if (variant === 'catalog') {
        const gancho = ganchoProducao(acf)
        const firstGenre = (production.production_genre ?? [])[0]
        return (
            <Link href={`/productions/${production.slug}`} className="group flex flex-col">
                <div className="relative mb-3 aspect-2/3 overflow-hidden bg-surface">
                    {image ? (
                        <Image src={image.src} alt="" fill priority={priority} fetchPriority={priority ? 'high' : undefined} sizes={sizes}
                            className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted/30"><Film size={40} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                    {acf.rating != null && (
                        <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-gold backdrop-blur-xs">
                            <Star size={9} fill="currentColor" />{Number(acf.rating).toFixed(1)}
                        </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                        {acf.type && (
                            <div className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-xs">
                                {acf.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}{labels.productionType(acf.type)}
                            </div>
                        )}
                        {acf.age_rating && (
                            <div className="rounded-sm bg-foreground/90 px-1 py-0.5 text-[9px] font-black text-background">{acf.age_rating}</div>
                        )}
                    </div>
                    {gancho && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 via-55% to-transparent px-2.5 pb-2.5 pt-10 text-white">
                            {(gancho.rede || gancho.noAr) && (
                                <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,.9)]">
                                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                                    {[gancho.rede, gancho.noAr ? labels.productionStatus('airing') : undefined].filter(Boolean).join(' · ')}
                                </span>
                            )}
                            <span className={`mt-1 line-clamp-2 block ${SERIF} text-[14px] font-bold italic leading-[1.1] [text-shadow:0_0_8px_rgba(0,0,0,.6)]`}>{gancho.elenco}</span>
                        </div>
                    )}
                </div>
                <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent">{title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {acf.year && <span className="text-[11px] text-muted">{acf.year}</span>}
                    {firstGenre && genreMap[firstGenre] && <><span className="text-muted/30">·</span><span className="text-[11px] text-muted">{genreMap[firstGenre]}</span></>}
                </div>
            </Link>
        )
    }

    return (
        <Link href={`/productions/${production.slug}`} className="group flex flex-col">
            <div className={`relative ${aspectRatio} overflow-hidden bg-surface mb-2`}>
                {image ? (
                    <Image src={image.src} alt="" fill priority={priority} fetchPriority={priority ? 'high' : undefined} sizes={sizes}
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                ) : (
                    <div className="h-full flex items-center justify-center bg-surface">
                        <Film size={28} className="text-muted/30" />
                    </div>
                )}
                {acf.rating != null && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                        <Star size={8} fill="currentColor" /> {Number(acf.rating).toFixed(1)}
                    </div>
                )}
                {acf.type && (
                    <div className="absolute top-2 right-2 bg-foreground/80 text-background font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-0.5">
                        {acf.type === 'movie' ? <Film size={8} /> : <Tv size={8} />}
                        {labels.productionType(acf.type)}
                    </div>
                )}
            </div>
            <p className="text-[12px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">{title}</p>
            {acf.year && <p className="font-mono text-[10px] text-muted mt-0.5">{acf.year}</p>}
        </Link>
    )
}

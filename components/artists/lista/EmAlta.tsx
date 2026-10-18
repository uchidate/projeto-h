import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { labelsFor } from '@/lib/i18n/labels'
import { GanchoArtista, grupoDe, destaqueDe } from '@/components/artists/lista/GanchoArtista'

const SERIF = 'font-[family-name:var(--font-playfair)]'

/** Os seis primeiros da ordem "Em alta", com número de posição no rosto. */
export function EmAlta({ artistas, verTodos, grupos = {} }: { artistas: WPArtist[]; verTodos: string; grupos?: Record<number, string> }) {
    const labels = labelsFor(useLocale())
    if (artistas.length === 0) return null
    return (
        <section aria-labelledby="em-alta-titulo" data-bloco="lista-em-alta" className="page-wrap pb-8 pt-6 sm:pb-10">
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="em-alta-titulo" className={`${SERIF} text-[28px] font-semibold leading-tight sm:text-[38px]`}>Em alta agora</h2>
                <a href={verTodos} className="text-[13px] font-semibold text-accent sm:text-[14px]">Ver todos →</a>
            </div>
            <ul className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-7 sm:grid sm:grid-cols-6 sm:gap-5 sm:overflow-visible sm:px-0">
                {artistas.map((a, i) => {
                    const foto = getWPImage(a._embedded, a.featured_image_url)
                    const nome = stripHtml(a.title.rendered)
                    const papel = (a.acf?.roles as string[] | undefined)?.map(labels.role)[0]
                    return (
                        <li key={a.id} className="w-[150px] shrink-0 sm:w-auto">
                            <Link href={`/artists/${a.slug}`} data-posicao={i + 1} className="group block">
                                <span className="relative block aspect-3/4 overflow-hidden bg-surface shadow-[0_18px_44px_rgba(0,0,0,.55)]">
                                    {foto && <Image src={foto.src} alt={foto.alt || nome} fill priority={i < 3} sizes="(max-width: 640px) 150px, 16vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
                                    <span aria-hidden className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-black/45 to-transparent" />
                                    <span aria-hidden className={`absolute left-2 top-1 ${SERIF} text-[44px] font-bold leading-none text-transparent sm:left-3 sm:text-[58px]`} style={{ WebkitTextStroke: '1.5px rgba(255,255,255,.95)', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.7))' }}>{String(i + 1).padStart(2, '0')}</span>
                                    <GanchoArtista destaque={destaqueDe(a)} grupoNome={grupoDe(a, grupos)} />
                                </span>
                                <span className="mt-2.5 block truncate text-[14px] font-bold sm:mt-3 sm:text-[16px]">{nome}</span>
                                {papel && <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:text-[11px]">{papel}</span>}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { useLocale, useTranslations } from 'next-intl'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { labelsFor } from '@/lib/i18n/labels'
import { grupoDe, destaqueDe } from '@/components/artists/lista/GanchoArtista'

const SERIF = 'font-[family-name:var(--font-playfair)]'

/** Os dezesseis primeiros da ordem "Em alta" (cards compactos: 2 fileiras de 8 no desktop), com número de posição no rosto. */
export function EmAlta({ artistas, verTodos, grupos = {} }: { artistas: WPArtist[]; verTodos: string; grupos?: Record<number, string> }) {
    const locale = useLocale()
    const labels = labelsFor(locale)
    const t = useTranslations('client.artistsLista')
    if (artistas.length === 0) return null
    return (
        <section aria-labelledby="em-alta-titulo" data-bloco="lista-em-alta" className="page-wrap pb-8 pt-6 sm:pb-10">
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="em-alta-titulo" className={`${SERIF} text-[28px] font-semibold leading-tight sm:text-[38px]`}>{t('trendingNow')}</h2>
                <a href={verTodos} className="text-[13px] font-semibold text-accent sm:text-[14px]">{t('seeAll')}</a>
            </div>
            <ul className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-7 sm:grid sm:grid-cols-4 sm:gap-4 lg:grid-cols-8 sm:overflow-visible sm:px-0">
                {artistas.map((a, i) => {
                    const foto = getWPImage(a._embedded, a.featured_image_url)
                    const nome = stripHtml(a.title.rendered)
                    const papel = (a.acf?.roles as string[] | undefined)?.map(r => labels.role(r, a.acf?.gender))[0]
                    const grupo = grupoDe(a, grupos)
                    const destaque = destaqueDe(a, locale)
                    return (
                        <li key={a.id} className="w-[120px] shrink-0 sm:w-auto">
                            <Link href={`/artists/${a.slug}`} data-posicao={i + 1} className="group block">
                                <span className="relative block aspect-3/4 overflow-hidden bg-surface shadow-[0_18px_44px_rgba(0,0,0,.55)]">
                                    {foto && <Image src={foto.src} alt={foto.alt || nome} fill priority={i < 4} sizes="(max-width: 640px) 120px, (max-width: 1024px) 25vw, 12vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
                                    <span aria-hidden className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-black/45 to-transparent" />
                                    <span aria-hidden className={`absolute left-2 top-1 ${SERIF} text-[34px] font-bold leading-none text-transparent sm:left-2.5 sm:text-[40px]`} style={{ WebkitTextStroke: '1.2px rgba(255,255,255,.95)', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.7))' }}>{String(i + 1).padStart(2, '0')}</span>
                                    {/* Mesmo desenho do card do diretório: o nome é o texto principal; a obra desce para a linha de baixo. */}
                                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 via-60% to-transparent px-2 pb-2 pt-8 sm:px-2.5">
                                        {grupo && <span className="mb-1 block w-fit max-w-full truncate bg-accent px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-[#0d0b0f] shadow-md">♪ {grupo}</span>}
                                        <span className={`line-clamp-2 block ${SERIF} text-[14px] font-bold leading-[1.1] text-white [text-shadow:0_1px_3px_rgba(0,0,0,.9)] sm:text-[15px]`}>{nome}</span>
                                    </span>
                                </span>
                                {destaque
                                    ? <span className="mt-1.5 block truncate text-[11.5px] leading-tight text-muted transition-colors group-hover:text-accent sm:text-[12px]"><span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-accent" />{destaque.titulo}</span>
                                    : papel && <span className="mt-1.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted sm:text-[10px]">{papel}</span>}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

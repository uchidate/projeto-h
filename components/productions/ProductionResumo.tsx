import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Calendar, Clock, Star, Tv } from 'lucide-react'
import type { WPArtist, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { href } from '@/lib/i18n/routes'

const ELENCO_NO_RESUMO = 8

interface Props {
    title: string
    synopsis: string
    rating?: number | null
    network?: string | null
    releaseLabel?: string | null
    episodes?: number | null
    durationMinutes?: number | null
    status?: { label: string; color: string } | null
    platforms: WPTerm[]
    cast: WPArtist[]
    castRoles: Map<string, string>
}

/**
 * Resumo da produção logo abaixo do hero: o que a pessoa que chegou por busca quer
 * saber em cinco segundos — nota, sinopse curta, ONDE ASSISTIR e quem atua.
 *
 * Na estrutura anterior a sinopse ficava a mais de 800 px de rolagem e o "onde
 * assistir" era um texto solto na faixa de métricas, escondido (`hidden sm:flex`)
 * no celular — que é 83% do tráfego. Aqui tudo cabe na primeira tela ou logo depois
 * dela, e cada parte tem `data-bloco` próprio: sem isso o clique em plataforma e o
 * clique em ator apareceriam como o mesmo bloco (a medição guarda só o caminho).
 *
 * O cartão de plataformas só existe com dado: em 2026-09 o catálogo inteiro (4.129
 * produções) não tinha nenhuma plataforma cadastrada, e uma caixa vazia em toda página
 * seria pior que nada. A faixa de elenco é só do celular: no desktop a lateral já
 * lista o elenco.
 *
 * O texto completo da sinopse e o resto da página seguem no mesmo HTML: mudar a
 * ordem de leitura não pode mudar o que o Google indexa.
 */
export function ProductionResumo({ title, synopsis, rating, network, releaseLabel, episodes, durationMinutes, status, platforms, cast, castRoles }: Props) {
    const t = useTranslations('profile.production')
    const locale = useLocale()
    const destaque = cast.slice(0, ELENCO_NO_RESUMO)
    const listagem = href('productions', undefined, locale)

    return (
        <section data-bloco="ficha-producao-resumo" aria-label={t('summary.summaryLabel', { title })} className="pt-6 pb-2 lg:pt-8">
            <div className={`grid gap-6 ${platforms.length > 0 ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10' : ''}`}>
                <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {rating != null && (
                            <span className="flex items-center gap-1.5">
                                <Star size={15} className="text-amber-400" fill="currentColor" />
                                <span className="text-[15px] font-black text-foreground">{Number(rating).toFixed(1)}</span>
                                <span className="text-[12px] text-muted">/10</span>
                            </span>
                        )}
                        {network && (
                            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground"><Tv size={12} className="text-muted" />{network}</span>
                        )}
                        {releaseLabel && (
                            <span className="flex items-center gap-1.5 text-[13px] text-muted"><Calendar size={12} />{releaseLabel}</span>
                        )}
                        {episodes != null && episodes > 0 && (
                            <span className="flex items-center gap-1.5 text-[13px] text-muted">
                                <Clock size={12} />{episodes} ep.{durationMinutes ? ` · ${durationMinutes} min` : ''}
                            </span>
                        )}
                        {status && (
                            <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${status.color}`}>{status.label}</span>
                        )}
                    </div>
                    {synopsis && (
                        <p className="line-clamp-3 text-[16px] leading-relaxed text-foreground/90 lg:line-clamp-4 lg:text-[17px]">{synopsis}</p>
                    )}
                    <a href="#sinopse" className="mt-3 inline-block font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-strong">
                        {t('summary.readFull')} ↓
                    </a>
                </div>

                {platforms.length > 0 && (
                    <div data-bloco="ficha-producao-onde-assistir" className="min-w-0 self-start border border-border bg-surface p-4 sm:p-5">
                        <h2 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">{t('summary.whereToWatch')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {platforms.map(p => (
                                <Link key={p.id} href={`${listagem}?platform=${p.slug}`}
                                    className="border border-border bg-background px-3.5 py-2 text-[14px] font-bold text-foreground transition-colors hover:border-accent/60 hover:text-accent">
                                    {p.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {destaque.length > 0 && (
                <div data-bloco="ficha-producao-elenco-principal" className="mt-8 border-t border-border pt-6 lg:hidden">
                    <div className="mb-4 flex items-baseline justify-between gap-4">
                        <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">{t('summary.mainCast')}</h2>
                        {cast.length > destaque.length && (
                            <a href="#elenco" className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-strong">{t('summary.allCast')} →</a>
                        )}
                    </div>
                    <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:gap-x-6 sm:gap-y-5 sm:overflow-visible sm:px-0">
                        {destaque.map(artist => {
                            const nome = stripHtml(artist.title.rendered)
                            const foto = getWPImage(artist._embedded, artist.featured_image_url)
                            const papel = castRoles.get(artist.slug)
                            return (
                                <li key={artist.id} className="w-[84px] shrink-0 snap-start sm:w-24">
                                    <Link href={`/artists/${artist.slug}`} className="group block text-center">
                                        <span className="relative mx-auto block h-[72px] w-[72px] overflow-hidden rounded-full border border-border bg-surface sm:h-20 sm:w-20">
                                            {foto ? (
                                                <Image src={foto.src} alt="" fill sizes="80px" className="object-cover object-top transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <span className="flex h-full items-center justify-center text-[22px] font-black text-accent/40">{nome[0]}</span>
                                            )}
                                        </span>
                                        <span className="mt-2 block truncate text-[12px] font-bold text-foreground group-hover:text-accent">{nome}</span>
                                        {papel && <span className="block truncate text-[11px] text-muted">{papel}</span>}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </section>
    )
}

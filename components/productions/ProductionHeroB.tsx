import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Play, Star } from 'lucide-react'
import type { WPTerm } from '@/lib/wordpress/types'
import { ProductionActions } from '@/components/productions/ProductionActions'
import { ShareBar } from '@/components/ui/ShareBar'

interface Props {
    productionId: number
    productionUrl: string
    title: string
    originalTitle?: string | null
    subtitle?: string | null
    year?: number | null
    typeLabel?: string
    genres: WPTerm[]
    rating?: number | null
    episodes?: number | null
    durationMinutes?: number | null
    status?: { label: string; color: string } | null
    backdrop?: string
    poster?: { src: string } | null
    hasTrailer: boolean
}

/**
 * Hero da página de produção, mais baixo que o anterior (480 px no desktop, 318 no
 * celular contra 620–680): a sinopse e "onde assistir" precisam aparecer na primeira
 * tela, e um hero de tela cheia empurrava tudo para baixo de 800 px.
 *
 * A nota, os episódios e o status ficam AQUI, na linha logo abaixo do título, e não
 * mais numa faixa separada: é a informação que responde "vale a pena?" e vem antes
 * de qualquer rolagem. O fundo é sempre a cena (backdrop); o pôster fica em primeiro
 * plano à esquerda, como nas fichas de cinema, e cai para a imagem única quando só
 * há um dos dois.
 */
export function ProductionHeroB({
    productionId, productionUrl, title, originalTitle, subtitle, year, typeLabel, genres, rating,
    episodes, durationMinutes, status, backdrop, poster, hasTrailer,
}: Props) {
    const t = useTranslations('profile')
    const fundo = backdrop ?? poster?.src

    return (
        <section aria-labelledby="titulo-producao" className="relative mx-auto flex h-[318px] max-w-[1440px] overflow-hidden bg-[#0d0b0f] sm:h-[400px] lg:h-[480px]">
            {fundo && (
                <Image src={fundo} alt="" fill priority sizes="100vw"
                    className={`object-cover ${backdrop ? 'object-[center_22%]' : 'object-top opacity-40'}`} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-[#0d0b0f] via-[#0d0b0f]/60 to-[#0d0b0f]/25" />
            <div className="absolute inset-0 hidden bg-linear-to-r from-[#0d0b0f]/80 via-transparent to-transparent lg:block" />

            <div className="page-wrap relative z-10 mt-auto w-full pb-5 sm:pb-8 lg:pb-10">
                <div className="flex items-end gap-4 sm:gap-8 lg:gap-10">
                    {poster && (
                        <div className="relative aspect-2/3 w-[112px] shrink-0 overflow-hidden border border-white/25 bg-surface shadow-2xl sm:w-[150px] lg:w-[200px]">
                            <Image src={poster.src} alt={t('production.posterAlt', { title })} fill sizes="(min-width: 1024px) 200px, 150px" className="object-cover" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-bold sm:mb-4 sm:text-[13px]">
                            {typeLabel && (
                                <span className="border border-white/30 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white sm:px-2.5 sm:text-[11px]">{typeLabel}</span>
                            )}
                            {year && <span className="text-accent">{year}</span>}
                            {genres.length > 0 && <span className="hidden text-white/75 sm:inline">{genres.map(g => g.name).join(' · ')}</span>}
                        </div>
                        <h1 id="titulo-producao" className="font-serif text-[40px] font-bold leading-none tracking-tight text-white sm:text-[56px] lg:text-[76px]">{title}</h1>
                        {(originalTitle || subtitle) && (
                            <p className="mt-2 flex flex-wrap items-baseline gap-x-4 sm:mt-3">
                                {originalTitle && <span className="text-[17px] font-bold text-accent sm:text-[22px]">{originalTitle}</span>}
                                {subtitle && <span className="hidden text-[15px] italic text-white/75 sm:inline">&ldquo;{subtitle}&rdquo;</span>}
                            </p>
                        )}
                        <div className="mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-white/80 sm:flex lg:mt-5">
                            {rating != null && (
                                <span className="flex items-center gap-1.5 font-bold text-white">
                                    <Star size={16} className="text-amber-400" fill="currentColor" />{Number(rating).toFixed(1).replace('.', ',')}<span className="font-normal text-white/60">/10</span>
                                </span>
                            )}
                            {episodes != null && episodes > 0 && <span>{episodes} ep.{durationMinutes ? ` · ${durationMinutes} min` : ''}</span>}
                            {status && <span className={`px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${status.color}`}>{status.label}</span>}
                        </div>
                        <div className="mt-5 hidden flex-wrap items-center gap-3 sm:flex lg:mt-6">
                            {hasTrailer && (
                                <a href="#trailer" className="inline-flex h-12 items-center gap-2.5 bg-accent px-6 text-[14px] font-bold text-[#0d0b0f] transition-colors hover:bg-accent-strong">
                                    <Play size={15} fill="currentColor" /> {t('production.watchTrailer')}
                                </a>
                            )}
                            <ProductionActions productionId={productionId} mode="watch" variant="hero" />
                            <ProductionActions productionId={productionId} mode="favorite" />
                            <ShareBar url={productionUrl} title={title} horizontal showLabel={false} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

/**
 * Nota, episódios, status e ações para o celular (< 640 px), logo abaixo do hero:
 * dentro dele não cabem ao lado do pôster. No desktop as mesmas informações ficam
 * dentro do hero.
 */
export function ProductionHeroBMobile({
    productionId, productionUrl, title, rating, episodes, durationMinutes, status, hasTrailer,
}: Pick<Props, 'productionId' | 'productionUrl' | 'title' | 'rating' | 'episodes' | 'durationMinutes' | 'status' | 'hasTrailer'>) {
    const t = useTranslations('profile')
    return (
        <div className="page-wrap pt-4 sm:hidden">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-muted">
                {rating != null && (
                    <span className="flex items-center gap-1.5 font-bold text-foreground">
                        <Star size={15} className="text-amber-400" fill="currentColor" />{Number(rating).toFixed(1).replace('.', ',')}<span className="font-normal text-muted">/10</span>
                    </span>
                )}
                {episodes != null && episodes > 0 && <span>{episodes} ep.{durationMinutes ? ` · ${durationMinutes} min` : ''}</span>}
                {status && <span className={`px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${status.color}`}>{status.label}</span>}
            </div>
            <div className="mt-4 flex items-center gap-2.5">
                {hasTrailer && (
                    <a href="#trailer" className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-accent text-[14px] font-bold text-[#0d0b0f]">
                        <Play size={15} fill="currentColor" /> {t('production.watchTrailer')}
                    </a>
                )}
                <div className="flex-1"><ProductionActions productionId={productionId} mode="watch" variant="hero" /></div>
                <ShareBar url={productionUrl} title={title} horizontal showLabel={false} />
            </div>
        </div>
    )
}

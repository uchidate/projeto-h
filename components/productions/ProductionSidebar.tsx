import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { ExternalLink, Tv, Film, Star, ShieldCheck } from 'lucide-react'
import type { WPTerm, WPArtist } from '@/lib/wordpress/types'
import { ProfileSidebarAd } from '@/components/profiles/ProfileSidebarAd'
import { AtribuicaoJustWatch } from '@/components/productions/AtribuicaoJustWatch'
import { STATUS_LABELS } from '@/lib/productions/labels'
import { labelsFor } from '@/lib/i18n/labels'
import { getWPImage, stripHtml } from '@/lib/utils'
import Image from 'next/image'

interface Props {
    rating: number | null | undefined
    platforms: WPTerm[]
    type?: string
    year?: number
    episodes?: number
    durationMinutes?: number
    ageRating?: string
    network?: string
    director?: string
    writer?: string
    statusProduction?: string
    cast?: WPArtist[]
    castRoles?: Map<string, string>
    /**
     * Lateral da página nova: só ficha técnica e anúncio. A nota mora no hero, o
     * elenco na coluna principal e as plataformas no resumo; repeti-los aqui só
     * empurrava a ficha para baixo da dobra.
     */
    compacto?: boolean
}

const AGE_COLORS: Record<string, string> = {
    'L':  'bg-green-700 text-white',
    '10': 'bg-blue-600 text-white',
    '12': 'bg-yellow-500 text-black',
    '14': 'bg-orange-700 text-white',
    '16': 'bg-red-600 text-white',
    '18': 'bg-red-900 text-white',
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">{label}</p>
            {children}
        </div>
    )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-b-0">
            <span className="text-[11px] text-muted shrink-0">{label}</span>
            <span className="text-[12px] font-semibold text-foreground text-right">{value}</span>
        </div>
    )
}

type FichaProps = Pick<Props, 'type' | 'year' | 'episodes' | 'durationMinutes' | 'ageRating' | 'network' | 'director' | 'writer' | 'statusProduction'> & {
    /** `grade`: duas colunas, rótulo sobre o valor (celular); padrão: lista (lateral). */
    grade?: boolean
}

/** Ficha técnica: uma fonte só de rótulos e valores para a lateral e para o celular. */
export function FichaLinhas({ type, year, episodes, durationMinutes, ageRating, network, director, writer, statusProduction, grade = false }: FichaProps) {
    const t = useTranslations('profile.ui')
    const labels = labelsFor(useLocale())
    const tProduction = useTranslations('profile.production')
    const typeLabel = type ? labels.productionType(type) : null
    const typeIcon = type === 'movie' ? <Film size={11} /> : <Tv size={11} />
    const statusInfo = statusProduction && STATUS_LABELS[statusProduction]
        ? { ...STATUS_LABELS[statusProduction], label: labels.productionStatus(statusProduction) ?? STATUS_LABELS[statusProduction].label }
        : null
    const ageColor = ageRating ? (AGE_COLORS[ageRating] ?? 'bg-surface text-foreground border border-border') : null
    const Linha = grade ? GradeItem : MetaRow

    return (
        <div className={grade ? 'grid grid-cols-2 gap-x-5' : undefined}>

                        {typeLabel && (
                            <Linha label={t('sidebar.type')} value={
                                <span className={`flex items-center gap-1 ${grade ? 'justify-start' : 'justify-end'}`}>{typeIcon}{typeLabel}</span>
                            } />
                        )}
                        {statusInfo && (
                            <Linha label={t('sidebar.status')} value={
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                            } />
                        )}
                        {year && <Linha label={t('sidebar.year')} value={year} />}
                        {network && <Linha label={t('sidebar.network')} value={network} />}
                        {episodes && <Linha label={t('sidebar.episodes')} value={tProduction('episodesShort', { count: episodes })} />}
                        {durationMinutes && <Linha label={t('sidebar.duration')} value={tProduction('durationShort', { count: durationMinutes })} />}
                        {ageRating && (
                            <Linha label={t('sidebar.ageRating')} value={
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black ${ageColor}`}>
                                    <ShieldCheck size={9} />{ageRating === 'L' ? tProduction('ageRatingFree') : `${ageRating}+`}
                                </span>
                            } />
                        )}
                        {director && <Linha label={t('sidebar.director')} value={director} />}
                        {writer && <Linha label={t('sidebar.writer')} value={writer} />}
        </div>
    )
}

function GradeItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="border-b border-border/40 py-3">
            <dt className="text-[12px] text-muted">{label}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-foreground">{value}</dd>
        </div>
    )
}

export function ProductionSidebar({
    rating, platforms, type, year, episodes, durationMinutes,
    ageRating, network, director, writer, statusProduction,
    cast = [], castRoles, compacto = false,
}: Props) {
    const t = useTranslations('profile.ui')

    const hasMeta = !!(type || year || episodes || durationMinutes || network || director || writer || statusProduction || ageRating)

    return (
        <aside aria-label={t('sidebar.moreInfo')}
            className="hidden xl:flex flex-col gap-5 w-[300px] shrink-0 sticky top-[calc(var(--site-header-h,52px)+var(--reading-bar-h,42px)+56px)]">

            {!compacto && rating != null && (
                <SidebarSection label={t('sidebar.rating')}>
                    <div className="flex items-end gap-3">
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <Star size={20} fill="currentColor" />
                            <span className="text-[42px] font-black leading-none">{Number(rating).toFixed(1)}</span>
                        </div>
                        <span className="text-[13px] text-muted mb-1">/&nbsp;10</span>
                    </div>
                </SidebarSection>
            )}

            {!compacto && cast.length > 0 && (
                <SidebarSection label={t('sidebar.mainCast')}>
                    <div className="space-y-2">
                        {cast.map(artist => {
                            const artistImage = getWPImage(artist._embedded, artist.featured_image_url)
                            const artistName = stripHtml(artist.title.rendered)
                            return (
                                <Link key={artist.id} href={`/artists/${artist.slug}`}
                                    className="flex items-center gap-2.5 border border-border bg-background p-2 transition-colors hover:border-accent/40">
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface">
                                        {artistImage && <Image src={artistImage.src} alt={artistName} fill sizes="36px" className="object-cover object-top" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] font-black">{artistName}</p>
                                        {castRoles?.get(artist.slug) && (
                                            <p className="truncate text-[10px] text-muted">{castRoles.get(artist.slug)}</p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </SidebarSection>
            )}

            {hasMeta && (
                <SidebarSection label={t('sidebar.technical')}>
                    <FichaLinhas type={type} year={year} episodes={episodes} durationMinutes={durationMinutes}
                        ageRating={ageRating} network={network} director={director} writer={writer} statusProduction={statusProduction} />
                </SidebarSection>
            )}

            {!compacto && platforms.length > 0 && (
                <SidebarSection label={t('sidebar.whereToWatch')}>
                    <ul className="space-y-2">
                        {platforms.map(p => (
                            <li key={p.id} className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                                <ExternalLink size={12} className="text-muted shrink-0" />
                                {p.name}
                            </li>
                        ))}
                    </ul>
                    <AtribuicaoJustWatch className="mt-3 block" />
                </SidebarSection>
            )}

            <ProfileSidebarAd analyticsPlacement="production_profile_sidebar" />
        </aside>
    )
}

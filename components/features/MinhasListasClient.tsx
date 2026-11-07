'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from '@/components/i18n/LocalizedLink'
import { BookmarkCheck, CheckCircle2, Compass, Film, Heart, ListChecks, PlayCircle } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { ProductionCard } from '@/components/productions/ProductionCard'
import type { WPProduction } from '@/lib/wordpress/types'

interface Props {
    initialTab: ListTab
    favProductions: WPProduction[]
    watchProductions: WPProduction[]
    watchingProductions: WPProduction[]
    watchedProductions: WPProduction[]
    favoriteIds: number[]
    watchlistIds: number[]
    watchingIds: number[]
    watchedIds: number[]
}

type ListTab = 'favoritos' | 'lista' | 'assistindo' | 'assistidos'

export function MinhasListasClient({
    initialTab,
    favProductions,
    watchProductions,
    watchingProductions,
    watchedProductions,
    favoriteIds,
    watchlistIds,
    watchingIds,
    watchedIds,
}: Props) {
    const t = useTranslations('client.minhasListas')
    const [tab, setTab] = useState<ListTab>(initialTab)
    const tabs: Record<ListTab, {
        title: string
        label: string
        description: string
        emptyTitle: string
        emptyDescription: string
        productions: WPProduction[]
        count: number
        icon: typeof Heart
    }> = {
        favoritos: {
            title: t('favoritos.label'),
            label: t('favoritos.label'),
            description: t('favoritos.description'),
            emptyTitle: t('favoritos.emptyTitle'),
            emptyDescription: t('favoritos.emptyDescription'),
            productions: favProductions,
            count: favoriteIds.length,
            icon: Heart,
        },
        lista: {
            title: t('lista.label'),
            label: t('lista.label'),
            description: t('lista.description'),
            emptyTitle: t('lista.emptyTitle'),
            emptyDescription: t('lista.emptyDescription'),
            productions: watchProductions,
            count: watchlistIds.length,
            icon: BookmarkCheck,
        },
        assistindo: {
            title: t('assistindo.label'),
            label: t('assistindo.label'),
            description: t('assistindo.description'),
            emptyTitle: t('assistindo.emptyTitle'),
            emptyDescription: t('assistindo.emptyDescription'),
            productions: watchingProductions,
            count: watchingIds.length,
            icon: PlayCircle,
        },
        assistidos: {
            title: t('assistidos.label'),
            label: t('assistidos.label'),
            description: t('assistidos.description'),
            emptyTitle: t('assistidos.emptyTitle'),
            emptyDescription: t('assistidos.emptyDescription'),
            productions: watchedProductions,
            count: watchedIds.length,
            icon: CheckCircle2,
        },
    }
    const activeCopy = tabs[tab]
    const productions = activeCopy.productions
    const count = activeCopy.count
    const totalSaved = favoriteIds.length + watchlistIds.length + watchingIds.length + watchedIds.length

    return (
        <div className="page-wrap py-8 lg:py-12">
            <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-1">{t('account')}</p>
                    <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em]">
                        {t('title')}<BrandDot />
                    </h1>
                    <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
                        {t('intro')}
                    </p>
                </div>
                <div className="grid grid-cols-4 border border-border bg-surface">
                    <div className="border-r border-border p-4">
                        <span className="block text-[24px] font-black leading-none">{favoriteIds.length}</span>
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-muted">{t('statFavorites')}</span>
                    </div>
                    <div className="border-r border-border p-4">
                        <span className="block text-[24px] font-black leading-none">{watchlistIds.length}</span>
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-muted">{t('statWant')}</span>
                    </div>
                    <div className="border-r border-border p-4">
                        <span className="block text-[24px] font-black leading-none">{watchingIds.length}</span>
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-muted">{t('statWatching')}</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-[24px] font-black leading-none">{totalSaved}</span>
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-muted">{t('statJourney')}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 grid gap-3 border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.entries(tabs) as Array<[ListTab, typeof tabs[ListTab]]>).map(([id, item]) => {
                    const Icon = item.icon
                    return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`flex flex-1 items-center justify-center gap-2 px-5 py-3 text-[13px] font-black transition-colors
                            ${tab === id
                                ? 'bg-accent-a11y text-white'
                                : 'bg-background text-muted hover:text-foreground'
                            }`}
                    >
                        <Icon size={14} />
                        {item.label}
                        <span className={`text-[11px] px-1.5 py-0.5 font-black ${tab === id ? 'bg-white/20 text-white' : 'bg-surface text-muted'}`}>
                            {item.count}
                        </span>
                    </button>
                    )
                })}
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">{t('collection')}</p>
                    <h2 className="text-[22px] font-black tracking-tight">{activeCopy.title}</h2>
                    <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{activeCopy.description}</p>
                </div>
                <Link href="/productions" className="inline-flex items-center justify-center gap-2 border border-border px-4 py-2 text-[12px] font-black uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent">
                    <Compass size={14} /> {t('explore')}
                </Link>
            </div>

            {productions.length === 0 ? (
                <div className="border border-dashed border-border bg-surface p-12 text-center">
                    {tab === 'favoritos' ? <Heart className="mx-auto mb-4 h-10 w-10 text-muted" />
                        : tab === 'assistindo' ? <PlayCircle className="mx-auto mb-4 h-10 w-10 text-muted" />
                        : tab === 'assistidos' ? <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-muted" />
                        : <ListChecks className="mx-auto mb-4 h-10 w-10 text-muted" />}
                    <h2 className="text-[18px] font-black mb-2">
                        {activeCopy.emptyTitle}
                    </h2>
                    <p className="text-[14px] text-muted mb-6 max-w-xs mx-auto">
                        {activeCopy.emptyDescription}
                    </p>
                    <Link href="/productions"
                        className="inline-flex items-center gap-2 bg-accent-a11y px-5 py-2.5 text-[13px] font-black text-white hover:opacity-90 transition-opacity">
                        <Film size={14} /> {t('exploreProductions')}
                    </Link>
                </div>
            ) : (
                <>
                    <p className="mb-4 text-[12px] text-muted font-semibold">
                        {t('count', { count })}
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {productions.map(p => (
                            <ProductionCard key={p.id} production={p} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

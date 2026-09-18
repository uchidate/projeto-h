import { Fragment } from 'react'
import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Link from 'next/link'
import { ALL_HUBS } from '@/lib/guias'
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { BrandDot } from '@/components/ui/BrandDot'
import { SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Guias de K-Drama, K-Pop e Cinema Coreano',
    description: 'Explore guias editoriais sobre produções, artistas e grupos do entretenimento coreano. Doramas por gênero, plataforma, artistas por agência e muito mais.',
    alternates: { canonical: `${SITE_URL}/guias` },
}

const KIND_LABELS: Record<string, string> = {
    productions: 'Produções',
    artists: 'Artistas',
    groups: 'Grupos',
}
const KIND_EYEBROW: Record<string, string> = {
    productions: 'Doramas, filmes e séries',
    artists: 'Cantores, atores e idols',
    groups: 'Girl groups e boy groups',
}
const KIND_ORDER = ['productions', 'artists', 'groups']

const FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'productions', label: 'Produções' },
    { value: 'artists', label: 'Artistas' },
    { value: 'groups', label: 'Grupos' },
]

interface Props {
    searchParams: Promise<{ kind?: string }>
}

export default async function GuiasPage({ searchParams }: Props) {
    const { kind } = await searchParams
    const activeKind = KIND_ORDER.includes(kind ?? '') ? kind : ''
    const visibleKinds = activeKind ? [activeKind] : KIND_ORDER
    const activeLabel = activeKind ? KIND_LABELS[activeKind] : 'Todos'
    const visibleCount = activeKind
        ? ALL_HUBS.filter(h => h.kind === activeKind).length
        : ALL_HUBS.length

    const totalByKind = Object.fromEntries(KIND_ORDER.map(k => [k, ALL_HUBS.filter(h => h.kind === k).length]))

    return (
        <>
            <ResponsiveFilterBar label="Categoria" value={activeLabel}>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted mr-2 shrink-0">
                        Categoria
                    </span>
                    {FILTERS.map(f => {
                        const isActive = f.value === (activeKind ?? '')
                        const href = f.value ? `/guias?kind=${f.value}` : '/guias'
                        return (
                            <Link
                                key={f.value}
                                href={href}
                                className={`px-3 py-1 text-[12px] font-semibold transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'bg-foreground text-background'
                                        : 'border border-border text-muted hover:border-foreground hover:text-foreground'
                                }`}
                            >
                                {f.label}
                            </Link>
                        )
                    })}
                </div>
            </ResponsiveFilterBar>

            <PageBreadcrumb
                crumbs={[{ label: 'Início', href: '/' }, { label: 'Guias' }]}
                description={`${visibleCount} guias`}
            />

            <div className="page-wrap py-8 space-y-14">

                {/* Hero */}
                <header className="border-b-2 border-foreground pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-2">
                            Guias editoriais
                        </p>
                        <h1 className="text-[36px] sm:text-[48px] font-black leading-[0.95] tracking-[-0.04em]">
                            Explore o universo<br />coreano<BrandDot />
                        </h1>
                    </div>
                    <div className="flex gap-6 pb-1 shrink-0">
                        {KIND_ORDER.map(k => (
                            <Link key={k} href={`/guias?kind=${k}`} className="group text-center">
                                <p className="text-[28px] font-black leading-none tracking-[-0.04em] group-hover:text-accent transition-colors">{totalByKind[k]}</p>
                                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted mt-0.5">{KIND_LABELS[k]}</p>
                            </Link>
                        ))}
                    </div>
                </header>

                {visibleKinds.map((k, indiceSecao) => {
                    const hubs = ALL_HUBS.filter(h => h.kind === k)
                    if (!hubs.length) return null
                    return (
                        <Fragment key={k}>
                        {/* Entre seções: a página tem ~14.700px de rolagem no celular e
                            não tinha anúncio nenhum (medido em 2026-09-17). */}
                        {indiceSecao > 0 && ADSENSE.slots.inline && (
                            <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="guias_lista" />
                        )}
                        <section>
                            <SectionTitleBar
                                eyebrow={KIND_EYEBROW[k]}
                                title={KIND_LABELS[k]}
                                className="mb-5"
                            />
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                                {hubs.map((hub) => (
                                    <li key={hub.slug}>
                                        <Link
                                            href={`/guias/${hub.slug}`}
                                            className="flex flex-col gap-1 bg-background p-4 h-full transition-colors hover:bg-surface group"
                                        >
                                            <span className="text-[13px] font-black text-foreground group-hover:text-accent transition-colors leading-snug">
                                                {hub.shortTitle}
                                            </span>
                                            {hub.description && (
                                                <p className="text-[11px] text-muted line-clamp-2 leading-5">
                                                    {hub.description}
                                                </p>
                                            )}
                                            <span className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                ver guia →
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        </Fragment>
                    )
                })}
            </div>
        </>
    )
}

'use client'

import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import { Search, Film, Mic2, BookOpen, Users, X, Building2, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import type { SearchResult, SearchResultType } from '@/lib/search/types'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { trackSearch, trackSearchClick, trackProductClick } from '@/lib/analytics'
import { EmptyState } from '@/components/ui/EmptyState'

function ResultCard({ result, query, position }: { result: SearchResult; query: string; position: number }) {
    const t = useTranslations('client.searchPage')
    const icons: Record<SearchResultType, React.ReactNode> = {
        production: <Film size={18} className="text-muted/40" />,
        artist:     <Mic2 size={18} className="text-muted/40" />,
        group:      <Users size={18} className="text-muted/40" />,
        post:       <BookOpen size={18} className="text-muted/40" />,
        company:    <Building2 size={18} className="text-muted/40" />,
        food:       <UtensilsCrossed size={18} className="text-muted/40" />,
        store_product: <ShoppingBag size={18} className="text-muted/40" />,
    }
    const registrarClique = () => {
        trackSearchClick({ query, position, type: result.type, href: result.href })
        if (result.type === 'store_product' && result.store) {
            trackProductClick({ productId: result.id, store: result.store, contexto: 'busca' })
        }
    }

    return (
        <Link href={result.href} onClick={registrarClique} target={result.type === 'store_product' ? '_blank' : undefined}
            rel={result.type === 'store_product' ? 'noopener noreferrer sponsored' : undefined}
            className="group flex items-center gap-3 p-3 border border-border hover:border-accent transition-colors bg-background">
            <div className="relative w-12 h-16 shrink-0 overflow-hidden bg-surface">
                {result.thumbnail ? (
                    <Image src={result.thumbnail} alt={result.title} fill
                        className="object-cover object-top" sizes="48px" />
                ) : (
                    <div className="flex h-full items-center justify-center">{icons[result.type]}</div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {result.title}
                </p>
                {result.subtitle && (
                    <p className="text-[12px] text-muted truncate mt-0.5">{result.subtitle}</p>
                )}
                <p className="font-mono text-[10px] text-muted uppercase tracking-[0.06em] mt-1">
                    {t(`types.${result.type}`)}
                </p>
            </div>
        </Link>
    )
}

const RESULT_SECTIONS: Array<{
    type: SearchResultType
    icon: React.ReactNode
}> = [
    { type: 'production', icon: <Film size={14} className="text-accent" /> },
    { type: 'artist',     icon: <Mic2 size={14} className="text-accent" /> },
    { type: 'group',      icon: <Users size={14} className="text-accent" /> },
    { type: 'company',    icon: <Building2 size={14} className="text-accent" /> },
    { type: 'food',       icon: <UtensilsCrossed size={14} className="text-accent" /> },
    { type: 'store_product', icon: <ShoppingBag size={14} className="text-accent" /> },
    { type: 'post',       icon: <BookOpen size={14} className="text-accent" /> },
]

interface Props {
    query: string
    results: SearchResult[]
    suggestions?: SearchResult[]
}

export function SearchResultsPage({ query, results, suggestions = [] }: Props) {
    const t = useTranslations('client.searchPage')
    const router = useRouter()
    const [value, setValue] = useState(query)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (query.length >= 2) trackSearch(query, results.length)
    }, [query, results.length])

    const navigate = (q: string) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
            router.push(`/search${qs}`)
        }, 350)
    }

    const total = results.length
    const hasQuery = query.length >= 2

    return (
        <div className="page-wrap py-10 max-w-3xl">
            {/* Search input */}
            <div className="mb-8">
                <div className="relative mb-5">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                        type="search"
                        value={value}
                        onChange={e => { setValue(e.target.value); navigate(e.target.value) }}
                        placeholder={t('placeholder')}
                        aria-label={t('aria')}
                        autoFocus
                        className="w-full h-12 pl-11 pr-10 border border-border bg-background text-[16px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors"
                    />
                    {value && (
                        <button type="button" aria-label={t('clear')} onClick={() => { setValue(''); navigate('') }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {hasQuery && (
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em]">
                        {t('results', { count: total })} <span className="text-foreground font-bold">&ldquo;{query}&rdquo;</span>
                    </p>
                )}
            </div>

            {!hasQuery && (
                <EmptyState icon={<Search size={48} />} description={t('minChars')} />
            )}

            {hasQuery && total === 0 && (
                <>
                    <EmptyState icon={<Search size={48} />} title={t('noneTitle')} description={t('noneDesc')} />
                    {suggestions.length > 0 && (
                        <div className="mt-8">
                            <p className="font-mono text-[11px] font-black uppercase tracking-widest text-muted mb-3">
                                {t('hot')}
                            </p>
                            <div data-bloco="busca-sugestoes" className="grid sm:grid-cols-2 gap-2">
                                {suggestions.map((result, i) => (
                                    <ResultCard key={`${result.type}-${result.id}`} result={result} query={query} position={i + 1} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="space-y-8">
                {RESULT_SECTIONS.reduce<React.ReactNode[]>((acc, section) => {
                    const sectionResults = results.filter(r => r.type === section.type)
                    if (sectionResults.length === 0) return acc
                    if (acc.length === 1 && ADSENSE.slots.inline) {
                        acc.push(<AdSlotInline key="ad" slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="search_results" />)
                    }
                    acc.push(
                        <section key={section.type}>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                                {section.icon}
                                <h2 className="font-mono text-[11px] font-black uppercase tracking-widest text-foreground">
                                    {t(`sections.${section.type}`)}
                                </h2>
                                <span className="font-mono text-[10px] text-muted ml-auto">{sectionResults.length}</span>
                            </div>
                            <div data-bloco="busca-resultados" className="grid sm:grid-cols-2 gap-2">
                                {sectionResults.map(result => (
                                    <ResultCard key={`${result.type}-${result.id}`} result={result} query={query} position={results.indexOf(result) + 1} />
                                ))}
                            </div>
                        </section>
                    )
                    return acc
                }, [])}
            </div>
        </div>
    )
}

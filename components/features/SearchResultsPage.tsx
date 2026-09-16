'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Search, Film, Mic2, BookOpen, Users, X, Building2, UtensilsCrossed } from 'lucide-react'
import type { SearchResult, SearchResultType } from '@/lib/search/types'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { trackSearch } from '@/lib/analytics'
import { EmptyState } from '@/components/ui/EmptyState'

function ResultCard({ result }: { result: SearchResult }) {
    const icons: Record<SearchResultType, React.ReactNode> = {
        production: <Film size={18} className="text-muted/40" />,
        artist:     <Mic2 size={18} className="text-muted/40" />,
        group:      <Users size={18} className="text-muted/40" />,
        post:       <BookOpen size={18} className="text-muted/40" />,
        company:    <Building2 size={18} className="text-muted/40" />,
        food:       <UtensilsCrossed size={18} className="text-muted/40" />,
    }
    const typeLabels: Record<SearchResultType, string> = {
        production: 'Produção',
        artist:     'Artista',
        group:      'Grupo',
        post:       'Artigo',
        company:    'Empresa',
        food:       'Comida',
    }

    return (
        <Link href={result.href}
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
                    {typeLabels[result.type]}
                </p>
            </div>
        </Link>
    )
}

const RESULT_SECTIONS: Array<{
    type: SearchResultType
    label: string
    icon: React.ReactNode
}> = [
    { type: 'production', label: 'Produções', icon: <Film size={14} className="text-accent" /> },
    { type: 'artist',     label: 'Artistas',  icon: <Mic2 size={14} className="text-accent" /> },
    { type: 'group',      label: 'Grupos',    icon: <Users size={14} className="text-accent" /> },
    { type: 'company',    label: 'Empresas',  icon: <Building2 size={14} className="text-accent" /> },
    { type: 'food',       label: 'Comidas',   icon: <UtensilsCrossed size={14} className="text-accent" /> },
    { type: 'post',       label: 'Artigos',   icon: <BookOpen size={14} className="text-accent" /> },
]

interface Props {
    query: string
    results: SearchResult[]
    suggestions?: SearchResult[]
}

export function SearchResultsPage({ query, results, suggestions = [] }: Props) {
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
                        placeholder="Buscar artistas, doramas, artigos…"
                        autoFocus
                        className="w-full h-12 pl-11 pr-10 border border-border bg-background text-[16px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors"
                    />
                    {value && (
                        <button type="button" aria-label="Limpar busca" onClick={() => { setValue(''); navigate('') }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {hasQuery && (
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em]">
                        {total} resultado{total !== 1 ? 's' : ''} para <span className="text-foreground font-bold">&ldquo;{query}&rdquo;</span>
                    </p>
                )}
            </div>

            {!hasQuery && (
                <EmptyState icon={<Search size={48} />} description="Digite pelo menos 2 caracteres para buscar" />
            )}

            {hasQuery && total === 0 && (
                <>
                    <EmptyState icon={<Search size={48} />} title="Nenhum resultado" description="Tente buscar por outro termo." />
                    {suggestions.length > 0 && (
                        <div className="mt-8">
                            <p className="font-mono text-[11px] font-black uppercase tracking-widest text-muted mb-3">
                                Em alta agora
                            </p>
                            <div data-bloco="busca-sugestoes" className="grid sm:grid-cols-2 gap-2">
                                {suggestions.map(result => (
                                    <ResultCard key={`${result.type}-${result.id}`} result={result} />
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
                                    {section.label}
                                </h2>
                                <span className="font-mono text-[10px] text-muted ml-auto">{sectionResults.length}</span>
                            </div>
                            <div data-bloco="busca-resultados" className="grid sm:grid-cols-2 gap-2">
                                {sectionResults.map(result => (
                                    <ResultCard key={`${result.type}-${result.id}`} result={result} />
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

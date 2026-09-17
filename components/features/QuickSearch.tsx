'use client'
/* eslint-disable react-hooks/set-state-in-effect -- async search results reset keyboard selection */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Command, Film, Mic2, Users, BookOpen, Loader2, TrendingUp, Building2, UtensilsCrossed } from 'lucide-react'
import { useQuickSearch } from '@/lib/hooks/useQuickSearch'
import { useWPSearch } from '@/hooks/useWPSearch'
import type { SearchResult } from '@/lib/search/types'
import { trackSearch } from '@/lib/analytics'

// Atalhos de navegação rápida — guiam o usuário sem precisar digitar
const SHORTCUTS = [
    { label: 'Novidades', href: '/blog?category=noticias-k-pop', icon: <TrendingUp size={16} /> },
    { label: 'Doramas', href: '/productions?type=drama', icon: <Film size={16} /> },
    { label: 'Artistas', href: '/artists', icon: <Mic2 size={16} /> },
    { label: 'Grupos', href: '/groups', icon: <Users size={16} /> },
    { label: 'Blog', href: '/blog', icon: <BookOpen size={16} /> },
]

const TYPE_LABEL: Record<SearchResult['type'], { label: string; icon: React.ReactNode }> = {
    post:       { label: 'Artigo',    icon: <BookOpen size={14} /> },
    production: { label: 'Produção',  icon: <Film size={14} /> },
    artist:     { label: 'Artista',   icon: <Mic2 size={14} /> },
    group:      { label: 'Grupo',     icon: <Users size={14} /> },
    company:    { label: 'Empresa',   icon: <Building2 size={14} /> },
    food:       { label: 'Comida',    icon: <UtensilsCrossed size={14} /> },
}

function groupByType(results: SearchResult[]): { type: SearchResult['type']; items: SearchResult[] }[] {
    const order: SearchResult['type'][] = ['production', 'artist', 'group', 'company', 'food', 'post']
    const map = new Map<SearchResult['type'], SearchResult[]>()
    for (const r of results) {
        if (!map.has(r.type)) map.set(r.type, [])
        map.get(r.type)!.push(r)
    }
    return order.filter(t => map.has(t)).map(type => ({ type, items: map.get(type)! }))
}

function highlightMatch(title: string, query: string): string {
    if (!query.trim()) return title
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return title.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-accent/20 text-accent font-black not-italic">$1</mark>')
}

export function QuickSearch() {
    const isOpen = useQuickSearch(s => s.isOpen)
    const closeModal = useQuickSearch(s => s.close)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    const { results, isLoading } = useWPSearch(query)

    const close = () => { closeModal(); setQuery(''); setActiveIndex(-1) }

    // Os atalhos (⌘K, Esc) e o evento global vivem em QuickSearchMount: eles
    // precisam responder antes de este modal existir, já que ele só é baixado
    // quando abre. Duplicar aqui faria dois handlers se anularem no ⌘K.

    // Foco + lock scroll
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 60)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        setActiveIndex(results.length > 0 ? 0 : -1)
    }, [results])

    useEffect(() => {
        if (!isLoading && query.trim().length >= 2) trackSearch(query.trim(), results.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registra a busca uma vez, quando o carregamento termina; incluir query/results mandaria um evento por tecla digitada
    }, [isLoading])

    if (!isOpen) return null

    const handleSelect = (href: string) => { close(); router.push(href) }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (activeIndex >= 0 && results[activeIndex]) {
            handleSelect(results[activeIndex].href)
        } else if (query.trim()) {
            handleSelect(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (results.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(current => (current + 1) % results.length)
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(current => current <= 0 ? results.length - 1 : current - 1)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-500 flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                onClick={close}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="animate-fadeInUp relative w-full max-w-2xl overflow-hidden border border-border bg-background shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="Busca rápida"
            >
                {/* Input */}
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        {isLoading
                            ? <Loader2 size={20} className="shrink-0 text-accent animate-spin" />
                            : <Search size={20} className="shrink-0 text-muted" />
                        }
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setActiveIndex(-1) }}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Buscar artistas, doramas, grupos, artigos..."
                            className="flex-1 bg-transparent text-[16px] text-foreground placeholder:text-muted outline-hidden border-none p-0"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            role="combobox"
                            aria-expanded={results.length > 0}
                            aria-controls="quick-search-results"
                            aria-activedescendant={activeIndex >= 0 ? `quick-search-result-${activeIndex}` : undefined}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="flex h-6 w-6 items-center justify-center text-muted hover:text-foreground"
                                aria-label="Limpar"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={close}
                            className="hidden sm:flex h-7 items-center gap-1 border border-border px-2 text-[11px] font-mono font-bold text-muted hover:text-foreground"
                            aria-label="Fechar"
                        >
                            ESC
                        </button>
                    </div>
                </form>

                {/* Resultados */}
                <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                    {query.trim().length < 2 ? (
                        /* Atalhos quando sem query — reduz zero-state friction */
                        <div className="p-4">
                            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted">Acesso rápido</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SHORTCUTS.map(s => (
                                    <button
                                        key={s.href}
                                        type="button"
                                        onClick={() => handleSelect(s.href)}
                                        className="flex items-center gap-2 border border-border bg-surface px-3 py-2.5 text-[13px] font-semibold text-foreground-subtle transition-colors hover:border-accent hover:bg-accent/5 hover:text-foreground"
                                    >
                                        <span className="text-accent">{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : results.length === 0 && !isLoading ? (
                        <div className="px-4 py-10 text-center text-sm text-muted">
                            Nenhum resultado para <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
                        </div>
                    ) : (
                        <div id="quick-search-results" role="listbox" className="py-2">
                            {groupByType(results).map(({ type, items }) => (
                                <div key={type}>
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-muted">
                                        {TYPE_LABEL[type].label}s
                                    </p>
                                    {items.map((result) => {
                                        const index = results.indexOf(result)
                                        const meta = TYPE_LABEL[result.type]
                                        return (
                                            <div
                                                id={`quick-search-result-${index}`}
                                                key={`${result.type}-${result.id}`}
                                                role="option"
                                                aria-selected={index === activeIndex ? true : false}
                                                tabIndex={0}
                                                onClick={() => handleSelect(result.href)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onKeyDown={e => e.key === 'Enter' && handleSelect(result.href)}
                                                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors ${
                                                    index === activeIndex ? 'bg-surface' : 'hover:bg-surface'
                                                }`}
                                            >
                                                <div className="h-9 w-9 shrink-0 overflow-hidden bg-surface">
                                                    {result.thumbnail ? (
                                                        <Image
                                                            src={result.thumbnail}
                                                            alt={result.title}
                                                            width={36}
                                                            height={36}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-muted">
                                                            {meta?.icon}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[13px] font-semibold text-foreground"
                                                        dangerouslySetInnerHTML={{ __html: highlightMatch(result.title, query) }}
                                                    />
                                                    {result.subtitle && (
                                                        <p className="truncate text-[11px] text-muted">{result.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Busca expandida — sempre visível quando há query */}
                    {query.trim().length >= 2 && (
                        <div className="border-t border-border px-4 py-3">
                            <button
                                type="button"
                                onClick={() => handleSelect(`/search?q=${encodeURIComponent(query.trim())}`)}
                                className="flex w-full items-center gap-2 text-[13px] font-semibold text-accent hover:underline"
                            >
                                <Search size={14} />
                                Ver todos os resultados para &ldquo;{query}&rdquo;
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer — instrução de teclado */}
                <div className="hidden sm:flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                        <kbd className="rounded-sm border border-border bg-surface px-1 font-mono">↵</kbd> selecionar
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="rounded-sm border border-border bg-surface px-1 font-mono">ESC</kbd> fechar
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                        <Command size={10} />
                        <kbd className="rounded-sm border border-border bg-surface px-1 font-mono">K</kbd>
                        abre/fecha
                    </span>
                </div>
            </div>
        </div>,
        document.body
    )
}

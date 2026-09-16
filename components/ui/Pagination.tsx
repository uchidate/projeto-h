import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    currentPage: number
    totalPages: number
    /** Gera a URL para cada página — recebe o número e retorna a string */
    buildHref: (page: number) => string
}

export function Pagination({ currentPage, totalPages, buildHref }: Props) {
    if (totalPages <= 1) return null

    const prev = currentPage - 1
    const next = currentPage + 1

    // Janela de páginas visíveis: sempre mostra 5 ao redor da atual
    const pages: (number | '…')[] = []
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pages.push(i)
        } else if (pages[pages.length - 1] !== '…') {
            pages.push('…')
        }
    }

    const btn = 'flex h-9 min-w-[36px] items-center justify-center border border-border px-2 text-[13px] font-semibold transition-colors'

    return (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-1.5 mt-12">
            {prev >= 1 ? (
                <Link href={buildHref(prev)} className={`${btn} text-muted hover:border-foreground hover:text-foreground`} aria-label="Página anterior">
                    <ChevronLeft size={16} />
                </Link>
            ) : (
                <span className={`${btn} text-muted/30 cursor-not-allowed`}><ChevronLeft size={16} /></span>
            )}

            {pages.map((p, i) =>
                p === '…' ? (
                    <span key={`e${i}`} className={`${btn} border-transparent text-muted cursor-default`}>…</span>
                ) : (
                    <Link
                        key={p}
                        href={buildHref(p)}
                        aria-current={p === currentPage ? 'page' : undefined}
                        className={`${btn} ${p === currentPage ? 'bg-foreground text-background border-foreground' : 'text-muted hover:border-foreground hover:text-foreground'}`}
                    >
                        {p}
                    </Link>
                )
            )}

            {next <= totalPages ? (
                <Link href={buildHref(next)} className={`${btn} text-muted hover:border-foreground hover:text-foreground`} aria-label="Próxima página">
                    <ChevronRight size={16} />
                </Link>
            ) : (
                <span className={`${btn} text-muted/30 cursor-not-allowed`}><ChevronRight size={16} /></span>
            )}
        </nav>
    )
}

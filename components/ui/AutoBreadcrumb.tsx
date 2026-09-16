'use client'

import { usePathname } from 'next/navigation'
import { BreadcrumbTrail } from '@/components/ui/BreadcrumbTrail'

const LABELS: Record<string, string> = {
    artists: 'Artistas',
    groups: 'Grupos K-Pop',
    productions: 'Produções',
    blog: 'Artigos',
    search: 'Busca',
    quiz: 'Quiz',
    about: 'Sobre',
    contato: 'Contato',
    privacidade: 'Privacidade',
    termos: 'Termos de Uso',
    romance: 'Romance',
    acao: 'Ação',
    suspense: 'Suspense',
    comedia: 'Comédia',
    filmes: 'Filmes',
    streamings: 'Streamings',
    classicos: 'Clássicos',
    netflix: 'Netflix',
    agencies: 'Agências',
    birthdays: 'Aniversários',
}

function formatSlug(s: string) {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function labelFor(seg: string) {
    return LABELS[seg] ?? formatSlug(seg)
}

export function AutoBreadcrumb() {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) return null

    const crumbs = [
        { label: 'Início', href: '/' },
        ...segments.map((seg, i) => ({
            label: labelFor(seg),
            href: '/' + segments.slice(0, i + 1).join('/'),
        })),
    ]

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-150 hidden sm:flex items-center h-8 bg-background border-t border-border/40">
            <BreadcrumbTrail
                items={crumbs}
                className="page-wrap flex min-w-0 items-center gap-1.5"
                itemClassName="flex min-w-0 items-center gap-1.5"
                linkClassName="shrink-0 whitespace-nowrap font-mono text-[11px] text-muted transition-colors hover:text-foreground"
                currentClassName="truncate font-mono text-[11px] text-foreground/60"
                separatorClassName="shrink-0 text-[10px] text-border/60"
            />
        </div>
    )
}

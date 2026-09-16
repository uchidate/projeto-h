import { intlLocale } from '@/lib/i18n/format'
import Link from 'next/link'

type Props = {
    title: string
    description: string
    count: number
    countLabel: string
    eyebrow?: string
}

/**
 * Abertura editorial compartilhada pelos grandes catálogos. Mantém filtros
 * como ferramenta e devolve ao conteúdo a primeira voz da página.
 */
export function CatalogIntro({ title, description, count, countLabel, eyebrow = 'Arquivo editorial' }: Props) {
    return (
        <header className="border-b border-border bg-background">
            <div className="page-wrap grid min-w-0 gap-5 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
                <div className="min-w-0">
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 font-mono text-[10px] text-muted">
                        <Link href="/" className="whitespace-nowrap transition-colors hover:text-foreground">Início</Link>
                        <span aria-hidden="true">/</span>
                        <span className="truncate text-foreground">{title}</span>
                    </nav>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
                    <h1 className="mt-2 min-w-0 max-w-[18ch] wrap-anywhere font-serif text-[clamp(2rem,1.4rem+2.5vw,3.75rem)] font-medium leading-[0.98] tracking-[-0.04em] text-foreground">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-[62ch] text-[14px] leading-6 text-muted sm:text-[15px]">
                        {description}
                    </p>
                </div>
                <p className="border-t border-border pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:min-w-[180px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <strong className="block font-serif text-[2rem] font-medium leading-none tracking-[-0.04em] text-foreground sm:text-[2.5rem]">
                        {count.toLocaleString(intlLocale())}
                    </strong>
                    <span className="mt-1.5 block">{countLabel}</span>
                </p>
            </div>
        </header>
    )
}

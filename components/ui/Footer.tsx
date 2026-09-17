import Link from 'next/link'
import { BrandDot } from '@/components/ui/BrandDot'
import { Rss } from 'lucide-react'
import { SITE_NAME } from '@/lib/constants/site'
import type { FooterColumn, SiteLink } from '@/lib/wordpress/site-settings'

export type FooterLabels = {
    rights: string
    privacy: string
    terms: string
    madeWith: string
    home: string
    nav: string
    mostSearched?: string
}

export default function Footer({ columns, tagline, labels, mostSearched = [] }: { columns: FooterColumn[]; tagline: string; labels: FooterLabels & { homeHref?: string }; mostSearched?: SiteLink[] }) {
    const year = new Date().getFullYear()

    return (
        <footer data-bloco="rodape" className="mt-16 border-t-2 border-accent bg-featured text-featured-fg">
            <div className="page-wrap py-10 sm:py-14">
                <div className="grid gap-6 pb-9 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.5fr)] lg:items-end lg:gap-12">
                    <Link
                        href={labels.homeHref ?? "/"}
                        className="min-w-0 wrap-anywhere font-sans text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.78] tracking-[-0.075em] text-featured-fg transition-colors hover:text-accent"
                        aria-label={labels.home}
                    >
                        {SITE_NAME}<BrandDot />
                    </Link>
                    <div className="border-l border-featured-border pl-5">
                        <p className="max-w-[34ch] text-[14px] leading-6 text-featured-muted sm:text-[15px]">{tagline}</p>
                        <a href="/feed.xml" className="mt-4 inline-flex min-h-11 items-center gap-2 whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-featured-muted transition-colors hover:text-accent">
                            <Rss size={13} aria-hidden="true" /> RSS Feed
                        </a>
                    </div>
                </div>

                <nav aria-label={labels.nav} className="grid grid-cols-2 border-y border-featured-border md:grid-cols-4">
                    {columns.map((col, index) => (
                        <div key={col.heading} className={`py-6 ${index % 2 === 0 ? 'pr-4' : 'border-l border-featured-border pl-4'} md:border-l md:border-featured-border md:px-5 md:first:border-l-0 md:first:pl-0`}>
                            <p className="mb-4 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-featured-muted">{col.heading}</p>
                            <ul className="space-y-3">
                                {col.links.map(link => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-[13px] leading-tight text-featured-muted transition-colors hover:text-featured-fg">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Links para fichas que o Google já mostra perto da página 1. Presentes em
                    todas as páginas, reforçam a relevância interna delas; a lista é
                    atualizada pela coleta diária do Search Console. */}
                {mostSearched.length > 0 && labels.mostSearched && (
                    <nav aria-label={labels.mostSearched} className="border-b border-featured-border py-6">
                        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-featured-muted">{labels.mostSearched}</p>
                        <ul className="flex flex-wrap gap-x-4 gap-y-2">
                            {mostSearched.map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-[13px] leading-tight text-featured-muted transition-colors hover:text-featured-fg">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <div className="flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
                    <p className="font-mono text-[10px] text-featured-muted sm:text-[11px]">
                        © {year} {SITE_NAME}. {labels.rights}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] text-featured-muted sm:text-[11px]">
                        <Link href="/privacidade" className="whitespace-nowrap transition-colors hover:text-featured-fg">{labels.privacy}</Link>
                        <Link href="/termos" className="whitespace-nowrap transition-colors hover:text-featured-fg">{labels.terms}</Link>
                        <span className="whitespace-nowrap">{labels.madeWith}</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

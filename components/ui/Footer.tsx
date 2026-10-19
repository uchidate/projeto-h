import Link from 'next/link'
import { BrandDot } from '@/components/ui/BrandDot'
import { BrandMark } from '@/components/ui/BrandMark'
import { Rss } from 'lucide-react'
import { IconInstagram } from '@/components/ui/SocialIcons'
import { SITE_NAME } from '@/lib/constants/site'
import type { FooterColumn, SiteLink } from '@/lib/wordpress/site-settings'

export type FooterLabels = {
    rights: string
    privacy: string
    terms: string
    home: string
    nav: string
    mostSearched?: string
}

export default function Footer({ columns, tagline, labels, mostSearched = [] }: { columns: FooterColumn[]; tagline: string; labels: FooterLabels & { homeHref?: string }; mostSearched?: SiteLink[] }) {
    const year = new Date().getFullYear()
    // Privacidade e Termos já ficam na linha de baixo; repeti-los numa coluna só duplica o link.
    const jaNaLinhaFinal = new Set(['/privacidade', '/termos', '/privacy', '/terms'])
    const colunas = columns
        .map(col => ({ ...col, links: col.links.filter(link => !jaNaLinhaFinal.has(link.href.replace(/^\/en/, ''))) }))
        .filter(col => col.links.length > 0)

    return (
        <footer data-bloco="rodape" className="mt-16 border-t-2 border-accent bg-featured text-featured-fg">
            <div className="page-wrap py-10 sm:py-14">
                <div className="flex flex-col gap-5 pb-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                    {/* Mesma proporção do cabeçalho: marca + nome em ~44 px, em vez do letreiro de 120 px. */}
                    <Link
                        href={labels.homeHref ?? "/"}
                        className="flex shrink-0 items-center gap-4 text-featured-fg transition-colors hover:text-accent"
                        aria-label={labels.home}
                    >
                        <BrandMark size={48} />
                        <span className="wrap-anywhere font-sans text-[clamp(2rem,3.4vw,2.75rem)] font-black leading-none tracking-[-0.05em]">
                            {SITE_NAME}<BrandDot />
                        </span>
                    </Link>
                    <p className="max-w-[44ch] text-[14px] leading-6 text-featured-muted sm:text-[15px] lg:flex-1 lg:border-l lg:border-featured-border lg:pl-8">{tagline}</p>
                    <div className="flex shrink-0 flex-wrap gap-2 self-start">
                    <a href="https://www.instagram.com/hallyuhub_br/" target="_blank" rel="noopener noreferrer me" data-bloco="rodape-instagram"
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start whitespace-nowrap border border-featured-border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-featured-muted transition-colors hover:border-accent hover:text-accent">
                        <IconInstagram size={13} /> Instagram
                    </a>
                    <a href="/feed.xml" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start whitespace-nowrap border border-featured-border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-featured-muted transition-colors hover:border-accent hover:text-accent lg:self-auto">
                        <Rss size={13} aria-hidden="true" /> RSS Feed
                    </a>
                    </div>
                </div>

                <nav aria-label={labels.nav} className="grid grid-cols-2 border-y border-featured-border md:grid-cols-4">
                    {colunas.map((col, index) => (
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
                    <nav aria-label={labels.mostSearched} data-bloco="rodape-mais-buscados" className="border-b border-featured-border py-6">
                        <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-featured-muted">{labels.mostSearched}</p>
                        <ul className="flex flex-wrap gap-2">
                            {mostSearched.map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="inline-flex min-h-9 items-center rounded-full border border-featured-border px-3.5 text-[13px] leading-tight text-featured-muted transition-colors hover:border-accent hover:text-featured-fg">
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
                    </div>
                </div>
            </div>
        </footer>
    )
}

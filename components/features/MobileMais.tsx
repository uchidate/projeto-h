'use client'
/* eslint-disable react-hooks/set-state-in-effect -- o portal monta no cliente e a folha fecha ao navegar */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight, Menu, ShoppingBag, X } from 'lucide-react'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { SITE_NAME } from '@/lib/constants/site'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { SeletorIdioma } from '@/components/i18n/SeletorIdioma'

interface NavLink { label: string; href: string }

/**
 * "Mais" do cabeçalho do celular: guarda o que não cabe nas abas (seções extras, Loja, sobre) e os
 * controles de tema, idioma e avisos, no lugar do hambúrguer. Folha que sobe de baixo: fecha ao
 * tocar fora, no X, com Esc ou ao navegar.
 */
export function MobileMais({ links, destacado = false }: { links: NavLink[]; destacado?: boolean }) {
    const [aberto, setAberto] = useState(false)
    const [montado, setMontado] = useState(false)
    const pathname = usePathname()
    const t = useTranslations('client')
    const isDefaultLocale = useLocale() === DEFAULT_LOCALE

    useEffect(() => { setMontado(true) }, [])
    useEffect(() => { setAberto(false) }, [pathname])
    useEffect(() => {
        if (!aberto) return
        const fecharComEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
        document.addEventListener('keydown', fecharComEsc)
        document.body.style.overflow = 'hidden'
        return () => { document.removeEventListener('keydown', fecharComEsc); document.body.style.overflow = '' }
    }, [aberto])

    const ativo = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`))
    const linha = 'flex h-[52px] items-center justify-between px-5 text-[17px] font-semibold text-foreground transition-colors hover:bg-surface'

    const folha = aberto && montado ? createPortal(
        <div className="fixed inset-0 z-9999 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.moreSections')}>
            <div className="absolute inset-0 bg-black/55" onClick={() => setAberto(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-2xl">
                <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-3">
                    <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-border-strong" />
                    <button type="button" onClick={() => setAberto(false)} aria-label={t('nav.closeMenu')} className="-mr-3 -mt-1 flex h-11 w-11 items-center justify-center text-muted hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <nav aria-label={t('nav.sections')} className="flex-1 overflow-y-auto overscroll-contain">
                    <p className="px-5 pb-1 pt-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{t('nav.browse')}</p>
                    <ul>
                        {links.map(({ label, href }) => (
                            <li key={href}>
                                <Link href={href} aria-current={ativo(href) ? 'page' : undefined} className={`${linha} ${ativo(href) ? 'text-accent' : ''}`}>
                                    {label}<ChevronRight size={16} className="text-muted" />
                                </Link>
                            </li>
                        ))}
                        {isDefaultLocale && (
                            <li>
                                <Link href="/loja" aria-current={ativo('/loja') ? 'page' : undefined} className={`${linha} ${ativo('/loja') ? 'text-accent' : ''}`}>
                                    <span className="flex items-center gap-2.5"><ShoppingBag size={18} />{t('nav.shop')}</span>
                                    <ChevronRight size={16} className="text-muted" />
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="shrink-0 space-y-1 border-t border-border px-5 py-3">
                    <p className="pb-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{t('nav.preferences')}</p>
                    <div className="flex h-12 items-center justify-between text-[15px] font-semibold"><span>{t('nav.theme')}</span><ThemeToggle /></div>
                    <div className="flex min-h-12 items-center justify-between text-[15px] font-semibold"><span>{t('nav.language')}</span><SeletorIdioma /></div>
                    {/* Só aparece quando o sino existe (visitante logado); sem ele a linha ficaria com rótulo e nada ao lado. */}
                    <div className="hidden h-12 items-center justify-between text-[15px] font-semibold has-[button]:flex"><span>{t('nav.notifications')}</span><NotificationBell /></div>
                    {isDefaultLocale && (
                        <Link href="/about" className="block pt-2 text-center text-[12px] text-muted hover:text-foreground">{t('nav.about', { site: SITE_NAME })}</Link>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    ) : null

    return (
        <>
            <button
                type="button"
                onClick={() => setAberto(true)}
                aria-expanded={aberto}
                aria-haspopup="dialog"
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold transition-colors ${destacado ? 'border-accent-a11y bg-accent-a11y text-white' : 'border-border-strong text-foreground hover:border-accent/60'}`}
            >
                <Menu size={15} aria-hidden />
                {t('nav.more')}
            </button>
            {folha}
        </>
    )
}

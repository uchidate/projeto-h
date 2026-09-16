'use client'
/* eslint-disable react-hooks/set-state-in-effect -- portal mount and navigation synchronize drawer state */

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { BrandDot } from '@/components/ui/BrandDot'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, ChevronRight, Flame, Film, Mic2, Users, BookOpen, Home, HelpCircle } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandMark'
import { SITE_NAME } from '@/lib/constants/site'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

interface NavLink { label: string; href: string }

// Ícones por rota — melhora escaneabilidade no mobile vs lista sem ícone do khub
const ICON_MAP: Record<string, React.ReactNode> = {
    '/':           <Home size={18} />,
    '/blog':       <BookOpen size={18} />,
    '/artists':    <Mic2 size={18} />,
    '/groups':     <Users size={18} />,
    '/productions':<Film size={18} />,
    '/quiz':       <HelpCircle size={18} />,
}

// Seções de destaque — converte visitantes em leitores regulares
const FEATURED_LINKS = [
    { label: 'Últimos artigos', href: '/blog', icon: <Flame size={16} className="text-accent" /> },
    { label: 'Explorar doramas', href: '/productions?type=drama', icon: <Film size={16} className="text-violet" /> },
]

export function MobileMenu({ links }: { links: NavLink[] }) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const t = useTranslations('client')
    // Destaques e "sobre" apontam para rotas que só existem em português.
    const isDefaultLocale = useLocale() === DEFAULT_LOCALE

    useEffect(() => { setMounted(true) }, [])
    // Fecha ao navegar
    useEffect(() => { setOpen(false) }, [pathname])
    // Trava scroll do body
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`)

    const drawer = open && mounted ? createPortal(
        <div
            className="fixed inset-0 z-9999 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
        >
            {/* Backdrop — fechar ao clicar fora */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div className="animate-slide-in-left relative flex h-full w-[min(85vw,360px)] flex-col overflow-hidden border-r border-border bg-background shadow-2xl">

                {/* Header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                    <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-foreground">
                        <BrandMark size={28} />
                        <span className="text-[18px] font-black tracking-[-0.035em]">
                            {SITE_NAME}<BrandDot />
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors hover:bg-surface hover:text-foreground"
                        aria-label={t('nav.closeMenu')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Corpo scrollável */}
                <div className="flex-1 overflow-y-auto overscroll-contain py-4">

                    {/* Navegação principal com ícones */}
                    <nav aria-label={t('nav.mainNav')}>
                        <p className="px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-muted">{t('nav.browse')}</p>
                        <ul>
                            {links.map(({ label, href }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 text-[15px] font-semibold transition-colors ${
                                            isActive(href)
                                                ? 'bg-accent/8 text-accent'
                                                : 'text-foreground hover:bg-surface hover:text-foreground'
                                        }`}
                                    >
                                        <span className={isActive(href) ? 'text-accent' : 'text-muted'}>
                                            {ICON_MAP[href]}
                                        </span>
                                        {label}
                                        {isActive(href) && <ChevronRight size={14} className="ml-auto text-accent" />}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {isDefaultLocale && (
                      <>
                      <div className="mx-4 my-4 border-t border-border" />

                      {/* Links em destaque — aumenta pageviews e tempo no site */}
                      <div>
                          <p className="px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-muted">Destaques</p>
                          <ul>
                              {FEATURED_LINKS.map(({ label, href, icon }) => (
                                  <li key={href}>
                                      <Link
                                          href={href}
                                          onClick={() => setOpen(false)}
                                          className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground"
                                      >
                                          {icon}
                                          {label}
                                      </Link>
                                  </li>
                              ))}
                          </ul>
                      </div>
                      </>
                    )}
                </div>

                {/* Footer do drawer — branding leve + link para sobre */}
                {isDefaultLocale && (
                <div className="shrink-0 border-t border-border p-4">
                    <Link
                        href="/about"
                        onClick={() => setOpen(false)}
                        className="block text-center text-[12px] text-muted transition-colors hover:text-foreground"
                    >
                        {t('nav.about', { site: SITE_NAME })}
                    </Link>
                </div>
                )}
            </div>
        </div>,
        document.body,
    ) : null

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-9 w-9 items-center justify-center border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-foreground"
                aria-label={t('nav.openMenu')}
                aria-expanded={open}
                aria-controls="mobile-menu-drawer"
            >
                <Menu size={20} />
            </button>
            {drawer}
        </>
    )
}

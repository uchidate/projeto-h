'use client'

import { useLocale, useTranslations } from 'next-intl'
import { intlLocale } from '@/lib/i18n/format'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Command, Search, ChevronRight, ShoppingBag } from 'lucide-react'
import { MobileMenu } from '@/components/features/MobileMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useQuickSearch } from '@/lib/hooks/useQuickSearch'
import { BrandMark } from '@/components/ui/BrandMark'
import { BrandDot } from '@/components/ui/BrandDot'
import { QuickSearchMount } from '@/components/features/QuickSearchMount'
import { UserMenu } from '@/components/ui/UserMenu'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { SITE_NAME } from '@/lib/constants/site'
import type { SiteLink } from '@/lib/wordpress/site-settings'


function AnimatedLogoLink({ subtitles }: { subtitles: string[] }) {
    const [si, setSi] = useState(0)
    const [text, setText] = useState(subtitles[0] ?? '')
    const [deleting, setDeleting] = useState(false)
    const pos = useRef((subtitles[0] ?? '').length)

    useEffect(() => {
        const target = subtitles[si] ?? subtitles[0] ?? ''
        let timeout: ReturnType<typeof setTimeout>
        if (!deleting) {
            if (pos.current < target.length) {
                timeout = setTimeout(() => { pos.current++; setText(target.slice(0, pos.current)) }, 40)
            } else {
                timeout = setTimeout(() => setDeleting(true), 8000)
            }
        } else {
            if (pos.current > 0) {
                timeout = setTimeout(() => { pos.current--; setText(target.slice(0, pos.current)) }, 22)
            } else {
                setDeleting(false)
                setSi(i => (i + 1) % Math.max(subtitles.length, 1))
            }
        }
        return () => clearTimeout(timeout)
    }, [text, deleting, si, subtitles])

    return (
        <Link href="/" className="flex items-end gap-5">
            <div className="mb-1 shrink-0 text-foreground">
                <BrandMark size={72} />
            </div>
            <div>
                {/* leading-none + pb garante alinhamento sem style inline */}
                <span className="block text-[52px] font-black leading-[0.86] tracking-[-0.055em] text-foreground">
                    {SITE_NAME}<BrandDot />
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em] text-muted min-w-[300px]">
                    {text}<span className="opacity-60 animate-pulse">|</span>
                </span>
            </div>
        </Link>
    )
}

function formatEditionDate(now = new Date()) {
    const date = new Intl.DateTimeFormat(intlLocale(), {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).format(now)
    const seul = now.toLocaleTimeString(intlLocale(), { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })
    const sp = now.toLocaleTimeString(intlLocale(), { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false })
    return `${date} · seul ${seul} · são paulo ${sp}`
}

const NavBar = ({
    navLinks,
    logoSubtitles,
}: {
    navLinks: SiteLink[]
    logoSubtitles: string[]
}) => {
    const navRef = useRef<HTMLElement | null>(null)
    const navLinksRef = useRef<HTMLDivElement | null>(null)
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isHidden, setIsHidden] = useState(false)
    const [showNavArrow, setShowNavArrow] = useState(false)
    const openSearch = useQuickSearch((state) => state.open)
    const t = useTranslations('client')
    // A Loja e as rotas do menu do WordPress só existem em português; fora dele
    // o cabeçalho não oferece o que levaria a uma página em outro idioma.
    const isDefaultLocale = useLocale() === DEFAULT_LOCALE
    const [editionDate, setEditionDate] = useState('')

    /* A Loja saiu da lista de navegação e virou botão próprio no cabeçalho:
       comércio e conteúdo competiam pelo mesmo tipo de slot. O filtro mantém o
       item fora da lista mesmo enquanto o WordPress ainda o devolve — sem ele,
       "Loja" apareceria duas vezes até a configuração remota ser atualizada. */
    const contentLinks = navLinks.filter(link => link.href !== '/loja')

    useEffect(() => {
        const tick = () => setEditionDate(formatEditionDate())
        tick()
        const now = new Date()
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
        const t = setTimeout(() => {
            tick()
            const iv = setInterval(tick, 60_000)
            return () => clearInterval(iv)
        }, msToNextMinute)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const el = navLinksRef.current
        if (!el) return
        const check = () => setShowNavArrow(
            el.scrollWidth > el.clientWidth + 4 && el.scrollLeft < el.scrollWidth - el.clientWidth - 4
        )
        check()
        el.addEventListener('scroll', check, { passive: true })
        const ro = new ResizeObserver(check)
        ro.observe(el)
        return () => { el.removeEventListener('scroll', check); ro.disconnect() }
    }, [])

    useEffect(() => {
        // Auto-hide no mobile: rolou pra baixo além da 1ª dobra → navbar +
        // faixa de categorias deslizam pra fora (125px de tela de volta —
        // medido em print real: eram 27% de chrome fixo no perfil de
        // artista); qualquer rolagem pra cima traz de volta. Desktop nunca
        // esconde (o guard de matchMedia também protege --site-header-h,
        // que os stickies de desktop consomem).
        let lastY = window.scrollY
        const handleScroll = () => {
            const y = window.scrollY
            setIsScrolled(y > 0)
            // innerWidth como fallback: jsdom (testes) e browsers antigos não
            // têm matchMedia — sem o guard, um scroll disparado em teste
            // derrubava o vitest inteiro com unhandled TypeError.
            const isMobile = typeof window.matchMedia === 'function'
                ? window.matchMedia('(max-width: 1023px)').matches
                : window.innerWidth < 1024
            if (!isMobile) { setIsHidden(false) }
            else if (y < lastY - 2 || y <= 150) { setIsHidden(false) }
            else if (y > lastY + 2 && y > 150) { setIsHidden(true) }
            lastY = y
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        const nav = navRef.current
        if (!nav) return
        const update = () => {
            const altura = Math.ceil(nav.getBoundingClientRect().height)
            // ESPACO RESERVADO — constante, nunca zero.
            //
            // O .navbar-spacer usa esta variavel como `height` e vive NO FLUXO
            // do documento. Enquanto ela ia a zero ao esconder o nav, o
            // espacador colapsava de 164px para nada e a pagina inteira saltava;
            // ao rolar de volta, saltava de novo. Medido em 2026-09-10: CLS de
            // 23,3 numa sessao com rolagem, 100% atribuido ao <main>, contra
            // 0,000 sem rolar nenhuma vez.
            //
            // O nav e `fixed`: escondê-lo e efeito visual e nao pode mexer no
            // fluxo. Por isso o espaco reservado nao muda.
            root.style.setProperty('--site-header-h', `${altura}px`)
            // DESLOCAMENTO VISUAL — este sim vai a zero.
            //
            // Serve apenas para `transform`, que roda no compositor e nao gera
            // deslocamento de layout. Nunca use em `top`, `height` ou `margin`:
            // animar essas propriedades recalcula layout a cada quadro, que foi
            // como as barras fixas contribuiam com um deslocamento a cada 33ms.
            root.style.setProperty('--site-header-offset', isHidden ? `-${altura}px` : '0px')
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(nav)
        window.addEventListener('resize', update)
        return () => {
            ro.disconnect()
            window.removeEventListener('resize', update)
            root.style.removeProperty('--site-header-h')
            root.style.removeProperty('--site-header-offset')
        }
    }, [isHidden])

    const handleOpenSearch = () => {
        openSearch()
        window.dispatchEvent(new Event('quick-search:open'))
    }

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname === href || pathname?.startsWith(`${href}/`)
    }

    return (
        <>
            <nav
                data-bloco="menu"
                ref={navRef}
                className={`fixed left-1/2 z-320 w-full max-w-[1440px] -translate-x-1/2 bg-background transition-[transform,box-shadow] duration-200 motion-reduce:transition-none ${isScrolled ? 'shadow-[0_1px_0_var(--color-border)]' : ''} ${isHidden ? 'max-lg:-translate-y-full' : ''}`}
            >
                {/* ── Mobile ── */}
                <div className="lg:hidden">
                    <div className="flex h-[52px] items-center justify-between border-b border-border px-3">
                        <div className="flex items-center gap-2">
                            <MobileMenu links={contentLinks} />
                            <Link href="/" className="flex items-center gap-2 text-foreground" aria-label={`${SITE_NAME} — página inicial`}>
                                <BrandMark size={32} />
                                <span className="text-[20px] font-black tracking-[-0.035em]">
                                    {SITE_NAME}<BrandDot />
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleOpenSearch}
                                className="flex h-9 w-9 items-center justify-center border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-foreground"
                                aria-label={t('nav.search')}
                            >
                                <Search className="h-[18px] w-[18px]" />
                            </button>
                            {isDefaultLocale && (
                                <Link
                                    href="/loja"
                                    aria-label={t('nav.shop')}
                                    aria-current={isActive('/loja') ? 'page' : undefined}
                                    className={`flex h-9 w-9 items-center justify-center border transition-colors ${
                                        isActive('/loja')
                                            ? 'border-accent text-accent'
                                            : 'border-transparent text-muted hover:border-border hover:bg-surface hover:text-foreground'
                                    }`}
                                >
                                    <ShoppingBag className="h-[18px] w-[18px]" />
                                </Link>
                            )}
                            <ThemeToggle />
                            <NotificationBell />
                            <UserMenu />
                        </div>
                    </div>

                    {/* Nav links mobile */}
                    <div className="navbar-dark-strip relative border-b border-white/20">
                        <div
                            ref={navLinksRef}
                            className="flex h-10 items-center overflow-x-auto px-2 scrollbar-none"
                        >
                            {contentLinks.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`nav-link-underline flex h-full shrink-0 items-center px-3 text-[13px] font-bold tracking-[-0.01em] transition-colors ${isActive(href) ? 'is-active nav-link-active' : 'is-inactive nav-link-inactive-mobile'}`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                        {showNavArrow && (
                            <div className="nav-links-fade pointer-events-none absolute right-0 top-0 flex h-full items-center pr-1.5 pl-6">
                                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Desktop ── */}
                <div className="hidden lg:block">
                    {/* Faixa de data */}
                    <div className="flex h-9 items-center border-b border-border px-10 font-mono text-[12px] lowercase tracking-[0.02em] text-muted">
                        <span>{editionDate}</span>
                    </div>

                    {/* Logo + botões */}
                    <div className="flex h-[112px] items-end justify-between border-b-2 border-foreground px-10 pb-5">
                        <AnimatedLogoLink subtitles={logoSubtitles} />
                        <div className="flex items-center gap-2 pb-2">
                            <button
                                type="button"
                                className="flex h-9 min-w-[300px] items-center gap-2 border border-border bg-background px-3 text-left text-[12px] font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground"
                                onClick={handleOpenSearch}
                                aria-label={t('nav.openSearch')}
                            >
                                <Search className="h-4 w-4 shrink-0 opacity-70" />
                                <span className="min-w-0 flex-1 truncate">{t('nav.searchPlaceholder')}</span>
                                <span className="inline-flex items-center gap-1 border-l border-border pl-2 font-mono text-[10px] font-black uppercase">
                                    <Command className="h-2.5 w-2.5" /> K
                                </span>
                            </button>
                            {isDefaultLocale && (
                                <Link
                                    href="/loja"
                                    aria-current={isActive('/loja') ? 'page' : undefined}
                                    className={`flex h-9 items-center gap-2 border px-3 text-[12px] font-black uppercase tracking-[0.06em] transition-colors ${
                                        isActive('/loja')
                                            ? 'border-accent text-accent'
                                            : 'border-border text-foreground hover:border-foreground hover:bg-surface'
                                    }`}
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    {t('nav.shop')}
                                </Link>
                            )}
                            <ThemeToggle />
                            <NotificationBell />
                            <UserMenu />
                        </div>
                    </div>

                    {/* Nav links desktop */}
                    <div className="navbar-dark-strip flex h-12 items-center border-b-2 border-foreground px-10">
                        <div className="flex h-full flex-1 items-center gap-5 overflow-x-auto xl:gap-8">
                            {contentLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={isActive(link.href) ? 'page' : undefined}
                                    className={`nav-link-underline flex h-full shrink-0 items-center text-[15px] font-bold tracking-[-0.02em] transition-colors ${isActive(link.href) ? 'is-active nav-link-active' : 'is-inactive nav-link-inactive'}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <QuickSearchMount />
            </nav>

            {/* Spacer para compensar o nav fixed */}
            <div aria-hidden="true" className="navbar-spacer" />
        </>
    )
}

export default NavBar

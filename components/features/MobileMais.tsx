'use client'
/* eslint-disable react-hooks/set-state-in-effect -- o portal monta no cliente e a folha fecha ao navegar */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from '@/components/i18n/LocalizedLink'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BookOpen, CalendarDays, Clapperboard, Compass, Heart, HelpCircle, Landmark, Menu, Newspaper, ShoppingBag, User, Users, Utensils, X, type LucideIcon } from 'lucide-react'
import { trackMenuOpen } from '@/lib/analytics'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { SITE_NAME } from '@/lib/constants/site'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { SeletorIdioma } from '@/components/i18n/SeletorIdioma'

interface NavLink { label: string; href: string }

/**
 * Menu do cabeçalho do celular: o site todo em uma folha, agrupado (catálogo, leitura, explorar), mais Loja
 * e os controles de tema, idioma e avisos. Folha que sobe de baixo: fecha ao tocar fora, no X, com Esc ou ao navegar.
 * O grupo e o ícone de cada item saem do endereço, porque em português a lista vem do WordPress.
 */
const ICONES: [RegExp, LucideIcon][] = [
    [/\/productions/, Clapperboard], [/\/artists/, User], [/\/groups/, Users], [/\/blog/, Newspaper],
    [/\/(guias|guides)/, BookOpen], [/cultura/, Landmark], [/\/(comidas|foods)/, Utensils], [/fandoms/, Heart],
    [/\/(calendario|calendar)/, CalendarDays], [/\/quiz/, HelpCircle],
]
const iconeDe = (href: string): LucideIcon => ICONES.find(([padrao]) => padrao.test(href))?.[1] ?? Compass
type Grupo = 'groupCatalog' | 'groupRead' | 'groupExplore'
const grupoDe = (href: string): Grupo =>
    /\/(productions|artists|groups|agencies)/.test(href) ? 'groupCatalog'
        : /\/(blog|guias|guides)|cultura/.test(href) ? 'groupRead' : 'groupExplore'
const GRUPOS: Grupo[] = ['groupCatalog', 'groupRead', 'groupExplore']

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
    const item = 'flex h-14 min-w-0 items-center gap-2.5 border border-border bg-surface px-3 text-[15px] font-semibold leading-tight text-foreground transition-colors hover:border-accent/60'
    const rotulo = 'px-5 pb-1.5 pt-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted'

    const folha = aberto && montado ? createPortal(
        // data-bloco: os toques nos itens entram na medição de recirculação (antes a folha ficava fora do bloco "menu" e era cega).
        <div data-bloco="menu-folha" className="fixed inset-0 z-9999 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
            <div className="absolute inset-0 bg-black/55" onClick={() => setAberto(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-2xl">
                <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-3">
                    <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-border-strong" />
                    <button type="button" onClick={() => setAberto(false)} aria-label={t('nav.closeMenu')} className="-mr-3 -mt-1 flex h-11 w-11 items-center justify-center text-muted hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <nav aria-label={t('nav.sections')} className="flex-1 overflow-y-auto overscroll-contain pb-3">
                    {GRUPOS.map(grupo => {
                        const doGrupo = links.filter(link => grupoDe(link.href) === grupo)
                        if (doGrupo.length === 0) return null
                        return (
                            <div key={grupo}>
                                <p className={rotulo}>{t(`nav.${grupo}`)}</p>
                                <ul className="grid grid-cols-2 gap-2 px-5">
                                    {doGrupo.map(({ label, href }) => {
                                        const Icone = iconeDe(href)
                                        return (
                                            <li key={href} className="min-w-0">
                                                <Link href={href} aria-current={ativo(href) ? 'page' : undefined} className={`${item} ${ativo(href) ? 'border-accent-a11y text-accent-a11y' : ''}`}>
                                                    <Icone size={18} className="shrink-0" aria-hidden /><span className="line-clamp-2 min-w-0">{label}</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )
                    })}
                    {isDefaultLocale && (
                        <div className="px-5 pt-4">
                            <Link href="/loja" aria-current={ativo('/loja') ? 'page' : undefined} className="flex h-12 items-center justify-center gap-2.5 bg-foreground text-[15px] font-extrabold text-background">
                                <ShoppingBag size={18} aria-hidden />{t('nav.shop')}
                            </Link>
                        </div>
                    )}
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
                onClick={() => { setAberto(true); trackMenuOpen() }}
                aria-expanded={aberto}
                aria-haspopup="dialog"
                className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-0.5 text-[12px] tracking-[-0.01em] transition-colors min-[360px]:gap-1.5 min-[360px]:text-[13px] ${destacado ? 'border-accent-a11y font-extrabold text-accent-a11y' : 'border-transparent font-semibold text-foreground hover:text-accent'}`}
            >
                <Menu size={15} aria-hidden className="shrink-0" />
                <span className="truncate">{t('nav.menuButton')}</span>
            </button>
            {folha}
        </>
    )
}

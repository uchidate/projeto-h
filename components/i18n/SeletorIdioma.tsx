'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { LOCALE_META, type Locale } from '@/lib/i18n/config'

type Versao = { locale: string; sigla: string; href: string }

/**
 * Seletor PT/EN no cabecalho, so quando a pagina existe no outro idioma.
 *
 * O cabecalho e compartilhado e nao sabe que versoes cada pagina tem. Cada
 * pagina ja declara as suas em `<link rel="alternate" hreflang>` (para o
 * Google); o seletor le essas tags depois da navegacao. Sem alternativa, nao
 * aparece — nunca leva a uma pagina inexistente.
 */
export function SeletorIdioma({ className = '', tom = 'claro' }: { className?: string; tom?: 'claro' | 'escuro' }) {
    const pathname = usePathname()
    const locale = useLocale() as Locale
    const t = useTranslations('client')
    const [versoes, setVersoes] = useState<Versao[]>([])

    useEffect(() => {
        // Metadados podem chegar depois do primeiro paint (streaming): le no
        // proximo quadro e de novo pouco depois.
        const ler = () => {
            const porLang = new Map<string, string>()
            document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
                const lang = link.getAttribute('hreflang') ?? ''
                if (lang && lang !== 'x-default') porLang.set(lang, new URL(link.href).pathname)
            })
            const lista: Versao[] = []
            for (const [codigo, meta] of Object.entries(LOCALE_META)) {
                const caminho = porLang.get(meta.htmlLang)
                if (caminho) lista.push({ locale: codigo, sigla: codigo.toUpperCase(), href: caminho })
            }
            setVersoes(lista.length > 1 ? lista : [])
        }
        const quadro = requestAnimationFrame(ler)
        const tardio = setTimeout(ler, 800)
        return () => { cancelAnimationFrame(quadro); clearTimeout(tardio) }
    }, [pathname])

    if (versoes.length < 2) return null

    const escuro = tom === 'escuro'
    return (
        <nav
            aria-label={t('nav.language')}
            className={`flex h-9 items-stretch border text-[12px] font-black uppercase tracking-[0.06em] ${escuro ? 'border-white/25' : 'border-border'} ${className}`}
        >
            <span aria-hidden="true" className={`flex items-center px-2 ${escuro ? 'text-white/60' : 'text-muted'}`}>
                <Globe className="h-4 w-4" />
            </span>
            {versoes.map((versao) => {
                const atual = versao.locale === locale
                return atual ? (
                    <span
                        key={versao.locale}
                        aria-current="page"
                        className={`flex items-center px-2.5 ${escuro ? 'bg-white text-black' : 'bg-foreground text-background'}`}
                    >
                        {versao.sigla}
                    </span>
                ) : (
                    <a
                        key={versao.locale}
                        href={versao.href}
                        hrefLang={LOCALE_META[versao.locale as Locale].htmlLang}
                        lang={LOCALE_META[versao.locale as Locale].htmlLang}
                        className={`flex items-center px-2.5 transition-colors ${escuro ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-foreground hover:bg-surface'}`}
                    >
                        {versao.sigla}
                    </a>
                )
            })}
        </nav>
    )
}

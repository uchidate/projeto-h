'use client'
/* eslint-disable react-hooks/set-state-in-effect -- o bloco só existe depois que a sessão resolve e a API responde (a home é estática) */

import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import type { Seguindo } from '@/lib/home/seguindo'
import { intlLocale } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'

const MONO = 'font-mono text-[11px] font-bold uppercase tracking-[0.12em]'

function quando(iso: string, hoje: string, ontem: string, locale: Locale) {
    const dia = new Date(iso.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
    const f = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
    const agora = new Date()
    if (f(dia) === f(agora)) return hoje
    if (f(dia) === f(new Date(agora.getTime() - 86_400_000))) return ontem
    return new Intl.DateTimeFormat(intlLocale(locale), { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(dia)
}

/**
 * "Novidades de quem você segue": só para quem tem conta e segue alguém; para o visitante o bloco não existe
 * (a home continua estática e igual para todos). Os seguidos vêm do mesmo "seguir" da ficha do artista e do grupo.
 */
export function HomeSeguindo() {
    const t = useTranslations('client.homeSeguindo')
    const locale = useLocale() as Locale
    const { data: session, status } = useSession()
    const [dados, setDados] = useState<Seguindo | null>(null)

    useEffect(() => {
        if (status !== 'authenticated') { setDados(null); return }
        let vivo = true
        fetch(`/api/home/seguindo?lang=${locale}`, { credentials: 'same-origin' })
            .then(r => (r.ok ? r.json() : null))
            .then((d: Seguindo | null) => { if (vivo) setDados(d) })
            .catch(() => {})
        return () => { vivo = false }
    }, [status, session?.user, locale])

    if (!dados || dados.novidades.length === 0) return null
    return (
        <section aria-label={t('titulo')} className="border border-border border-t-2 border-t-accent bg-[var(--color-home-card)] px-4 py-5 sm:px-6 lg:px-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[32px]">{t('titulo')}</h2>
                <span className={`border border-accent px-[7px] py-1 leading-none text-accent ${MONO}`}>{t('caixa')}</span>
            </div>
            <ul className="mb-4 flex flex-wrap gap-2">
                {dados.nomes.map(n => (
                    <li key={n} className="rounded-full border border-accent px-3 py-1 text-[12px] font-bold text-accent">{n} ✓</li>
                ))}
                <li><Link href={href('artists', undefined, locale)} className="rounded-full border border-dashed border-border px-3 py-1 text-[12px] font-bold text-muted hover:text-accent">{t('seguirMais')}</Link></li>
            </ul>
            <div className="grid gap-4 sm:grid-cols-3">
                {dados.novidades.map(n => (
                    <Link key={n.id} href={href('post', { slug: n.slug }, locale)} className="group block border border-border bg-background">
                        <span className="relative block aspect-video overflow-hidden bg-surface">
                            {n.imagem && <Image src={n.imagem} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
                            <span className={`absolute left-0 top-0 bg-accent px-2 py-1 leading-none text-white ${MONO} text-[11px]`}>{t('novo')} · {quando(n.data, t('hoje'), t('ontem'), locale)}</span>
                        </span>
                        <span className="block px-3 py-3">
                            <span className="block font-serif text-[16px] font-medium leading-snug text-foreground group-hover:text-accent">{n.titulo}</span>
                            <span className={`mt-1.5 block ${MONO} text-[11px] text-muted`}>{t('sobre', { nome: n.sobre })}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

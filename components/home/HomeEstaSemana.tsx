import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { AniversariosHome } from '@/lib/home/aniversarios'

const MARROM = 'text-[#8a5a00]'
const ROTULO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

function diaRotulo(data: string, locale: Locale) {
    const d = new Date(`${data}T12:00:00Z`)
    const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' }).format(d).replace('.', '')
    return `${fmt({ weekday: 'short' })} ${fmt({ day: '2-digit' })}`
}

/** Só no celular: o calendário sai do topo (coluna do hero) e vira esta faixa de aniversários perto do fim. */
export async function HomeEstaSemana({ aniversarios, locale = DEFAULT_LOCALE }: { aniversarios: AniversariosHome; locale?: Locale }) {
    const { hoje, seguintes, semana } = aniversarios
    const dias = [
        ...(hoje.length ? [{ data: semana[0], nomes: hoje.slice(0, 3).map(a => a.nome) }] : []),
        ...seguintes.map(d => ({ data: d.data, nomes: d.nomes.slice(0, 3).map(a => a.nome) })),
    ].slice(0, 4)
    if (dias.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.calendario' })
    return (
        <section aria-label={t('rotulo')} className="border border-border bg-[var(--color-home-card)] px-4 py-4 lg:hidden">
            <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[24px] font-medium leading-none tracking-[-0.02em] text-foreground">{t('estaSemana')}</h2>
                <span className={`border border-[#8a5a00] px-[7px] py-1 leading-none ${MARROM} ${ROTULO}`}>{t('tag')}</span>
                <Link href="/calendario" className={`ml-auto text-muted hover:text-accent ${ROTULO}`}>{t('abrir')}</Link>
            </div>
            <div className="-mx-4 grid auto-cols-[40%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                {dias.map(d => (
                    <div key={d.data} className="min-w-0 border-t border-border pt-2">
                        <p className={`${ROTULO} text-foreground`}>{diaRotulo(d.data, locale)}</p>
                        <ul className="mt-1.5 space-y-0.5 text-[13px] text-foreground">
                            {d.nomes.map(n => <li key={n}>{n}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    )
}

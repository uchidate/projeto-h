import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { AniversariosHome } from '@/lib/home/aniversarios'

const MARROM = 'text-[#8a5a00]'
const ROTULO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

function partes(data: string, locale: Locale) {
    const d = new Date(`${data}T12:00:00Z`)
    const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' }).format(d).replace('.', '')
    return { semana: fmt({ weekday: 'short' }), dia: fmt({ day: '2-digit' }), diaMes: fmt({ day: '2-digit', month: '2-digit' }) }
}

/** Faixa de sete dias, hoje, e os próximos aniversários (só nomes). O resto fica em /calendario. */
export async function HomeCalendario({ aniversarios, locale = DEFAULT_LOCALE }: { aniversarios: AniversariosHome; locale?: Locale }) {
    const { hoje, seguintes, semana } = aniversarios
    if (hoje.length === 0 && seguintes.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.calendario' })
    const comAniversario = new Set([...(hoje.length ? [semana[0]] : []), ...seguintes.map(d => d.data)])
    return (
        <aside aria-label={t('rotulo')} className="border-t border-border bg-background px-4 py-4 sm:px-6 lg:border-0 lg:bg-transparent lg:px-4">
            <div className="flex items-center justify-between">
                <h2 className={`${ROTULO} ${MARROM}`}>{t('titulo')}</h2>
                <Link href="/calendario" className={`${ROTULO} text-muted hover:text-accent`}>{t('abrir')}</Link>
            </div>
            <ol className="mt-2.5 grid grid-cols-7 gap-1">
                {semana.map((data, i) => {
                    const p = partes(data, locale)
                    return (
                        <li key={data} className={`flex flex-col items-center border py-1 leading-none ${i === 0 ? 'border-[#8a5a00] bg-[#8a5a00] text-white' : 'border-border text-foreground'}`}>
                            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.06em] opacity-80">{p.semana}</span>
                            <span className="mt-1 text-[14px] font-black">{p.dia}</span>
                            <span aria-hidden className={`mt-1 h-1 w-1 rounded-full ${comAniversario.has(data) && i !== 0 ? 'bg-[#8a5a00]' : 'bg-transparent'}`} />
                        </li>
                    )
                })}
            </ol>

            {hoje.length > 0 && (
                <section className="mt-3">
                    <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                        <h3 className={`${ROTULO} text-foreground`}>{t('hoje')} · {partes(semana[0], locale).semana} {partes(semana[0], locale).diaMes}</h3>
                        <span className={`${ROTULO} ${MARROM}`}>{t('tag')}</span>
                    </div>
                    <ul>
                        {hoje.map(a => (
                            <li key={a.slug} className="border-b border-border last:border-b-0">
                                <Link href={`/artists/${a.slug}`} className="group flex items-center gap-3 py-2.5">
                                    <span className="relative h-[50px] w-10 shrink-0 overflow-hidden bg-surface">
                                        {a.foto && <Image src={a.foto} alt="" fill sizes="40px" className="object-cover" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[14px] font-black leading-tight text-foreground group-hover:text-accent">{a.nome}</span>
                                        {a.hangul && <span className="block truncate text-[11px] text-muted">{a.hangul}</span>}
                                    </span>
                                    <span className="shrink-0 text-right leading-none">
                                        <span className={`block text-[22px] font-black ${MARROM}`}>{a.idade}</span>
                                        <span className="mt-1 block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted">{t('anos')}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {seguintes.length > 0 && (
                <section className="mt-3">
                    <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                        <h3 className={`${ROTULO} text-foreground`}>{t('aSeguir')}</h3>
                        <span className={`${ROTULO} ${MARROM}`}>{t('tag')}</span>
                    </div>
                    <ul>
                        {seguintes.map(dia => {
                            const p = partes(dia.data, locale)
                            return (
                                <li key={dia.data} className="flex gap-3 border-b border-border py-2.5 last:border-b-0">
                                    <span className={`w-[46px] shrink-0 whitespace-nowrap pt-0.5 ${ROTULO} ${MARROM}`}>{p.semana} {p.dia}</span>
                                    <span className="text-[13px] font-semibold leading-snug text-foreground">
                                        {dia.nomes.map((a, i) => (
                                            <span key={a.slug}>
                                                {i > 0 && ', '}
                                                <Link href={`/artists/${a.slug}`} className="hover:text-accent hover:underline">{a.nome}</Link>
                                            </span>
                                        ))}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}
        </aside>
    )
}

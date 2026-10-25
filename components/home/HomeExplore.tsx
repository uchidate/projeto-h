import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { postLink } from '@/components/home/postLink'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { CartaoExplore } from '@/lib/home/explore'
import { getWPImage, stripHtml } from '@/lib/utils'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

/** "24 OUT": dia e mês curtos do último texto, como na vitrine do mockup. */
function diaCurto(iso: string, locale: Locale) {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)).replace('.', '')
}

/** Dez assuntos do site, cada um com o total e a matéria mais recente. */
export async function HomeExplore({ cartoes, locale = DEFAULT_LOCALE }: { cartoes: CartaoExplore[]; locale?: Locale }) {
    if (cartoes.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.explore' })
    const tt = await getTranslations({ locale, namespace: 'home.explore.temas' })
    const ta = await getTranslations({ locale, namespace: 'home.explore.apoio' })
    return (
        <section aria-label={t('titulo')} className="border-t border-border bg-background px-4 py-5 sm:px-6 lg:px-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[32px]">{t('titulo')}</h2>
                <span className={`border border-accent px-[7px] py-1 leading-none text-accent ${MONO}`}>{t('caixa', { n: cartoes.length })}</span>
                <Link href="/guias" className={`ml-auto border-b border-foreground pb-0.5 text-foreground ${MONO}`}>{t('verTodos')}</Link>
            </div>
            <div className="-mx-4 grid auto-cols-[230px] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible lg:px-0">
                {cartoes.map(c => {
                    const imagem = c.ultimo ? getWPImage(c.ultimo._embedded, c.ultimo.featured_image_url) : null
                    return (
                        <div key={c.chave} className="group relative flex flex-col border border-border bg-background">
                            <Link href={c.href} className="relative block aspect-[16/9] overflow-hidden" style={{ backgroundColor: c.cor }}>
                                {c.hangul || !imagem
                                    ? <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[40px] font-black text-white">{c.hangul}</span>
                                    : <Image src={imagem.src} alt="" fill sizes="(max-width: 1024px) 230px, 18vw" className="object-cover transition-transform group-hover:scale-[1.03]" />}
                                <span className="absolute left-2 top-2 px-1.5 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.12em] text-white" style={{ backgroundColor: c.cor }}>{tt(c.chave)}</span>
                            </Link>
                            <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                                <p className="flex items-baseline gap-1.5">
                                    <span className="text-[28px] font-black leading-none" style={{ color: c.cor }}>{c.total.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')}</span>
                                    <span className={`${MONO} text-[9px] text-muted`}>{t(c.unidade)}</span>
                                </p>
                                {c.ultimo ? (
                                    <>
                                        <p className={`mt-2 flex items-center gap-1.5 ${MONO} text-[9px] text-muted`}>
                                            {t('ultimo')} · {diaCurto(c.ultimo.date, locale)}
                                            {c.novo && <span className="bg-accent px-1 py-0.5 leading-none text-white">{t('novo')}</span>}
                                        </p>
                                        <Link {...postLink(c.ultimo.slug, locale)} className="mt-1 text-[13px] font-semibold leading-snug text-foreground hover:text-accent line-clamp-3">{stripHtml(c.ultimo.title.rendered)}</Link>
                                    </>
                                ) : (
                                    <p className="mt-2 text-[13px] font-semibold leading-snug text-foreground">{ta('agencias')}</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

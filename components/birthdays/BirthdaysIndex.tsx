import { Fragment } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { temRecurso } from '@/lib/i18n/recursos'
import { metadataDaRota } from '@/lib/i18n/metadata-pagina'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { Cake } from 'lucide-react'
import { getArtists } from '@/lib/wordpress/artists'
import { SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { getVitrineGeral } from '@/lib/wordpress/vitrine'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizWidget } from '@/components/ui/QuizWidget'


/** Nomes dos meses no idioma da página (o português mantém a grafia capitalizada de sempre). */
function nomesDosMeses(locale: Locale): string[] {
    const fmt = new Intl.DateTimeFormat(LOCALE_META[locale].intl, { month: 'long', timeZone: 'UTC' })
    return Array.from({ length: 12 }, (_, i) => {
        const nome = fmt.format(new Date(Date.UTC(2024, i, 1)))
        return nome.charAt(0).toLocaleUpperCase(LOCALE_META[locale].intl) + nome.slice(1)
    })
}

type SearchParams = Promise<{ month?: string }>

export async function metadataDaPagina({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.birthdaysPage' })
    const sp = await searchParams
    const month = Math.min(12, Math.max(1, parseInt(sp.month ?? '0', 10) || new Date().getMonth() + 1))
    const monthName = nomesDosMeses(locale)[month - 1]
    return metadataDaRota({
        locale, rota: 'birthdays',
        titulo: t('title', { month: monthName }),
        descricao: t('description', { month: monthName }),
        robots: { index: true, follow: true },
    })
}

type BirthdayArtist = {
    id: number
    slug: string
    name: string
    image: { src: string; alt: string } | null
    birthDate: Date
    day: number
    age: number | null
    hangul?: string
    roles?: string[]
}

export default async function BirthdaysPage({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'client.birthdaysPage' })
    const loja = temRecurso('loja', locale)
    const quiz = temRecurso('quiz', locale)
    const MONTH_NAMES = nomesDosMeses(locale)
    const sp = await searchParams
    const now = new Date()
    const currentMonth = Math.min(12, Math.max(1, parseInt(sp.month ?? '0', 10) || now.getMonth() + 1))
    const currentYear = now.getFullYear()
    const monthName = MONTH_NAMES[currentMonth - 1]
    const { items: artists } = await getArtists({
        birthMonth: currentMonth,
        perPage: 100,
        orderby: 'date',
        order: 'asc',
    })

    // Parse + sort by day of month
    const withBirthday: BirthdayArtist[] = artists
        // Artista falecido não entra na agenda de aniversários.
        .filter(a => a.acf?.birth_date && !a.acf?.death_date)
        .flatMap(a => {
            let birthDate: Date
            try { birthDate = parseAcfDate(a.acf!.birth_date!) }
            catch { return [] }
            const day = birthDate.getUTCDate()
            const birthYear = birthDate.getUTCFullYear()
            const age = birthYear > 1900 ? currentYear - birthYear : null
            const item: BirthdayArtist = {
                id: a.id,
                slug: a.slug,
                name: stripHtml(a.title.rendered),
                image: getWPImage(a._embedded, a.featured_image_url),
                birthDate,
                day,
                age,
                hangul: a.acf?.name_hangul,
                roles: a.acf?.roles,
            }
            return [item]
        })
        .sort((a, b) => a.day - b.day)

    // Group by day
    const byDay = new Map<number, BirthdayArtist[]>()
    for (const artist of withBirthday) {
        const list = byDay.get(artist.day) ?? []
        list.push(artist)
        byDay.set(artist.day, list)
    }

    // Quem abre a página de aniversários está pensando em presente: a faixa vem antes da lista.
    const shopProducts = loja ? await getVitrineGeral('aniversarios', 6, 'kpop') : []

    return (
        <>
            <PageBreadcrumb items={[{ name: t('crumbArtists'), path: '/artists' }, { name: t('crumb'), path: '/artists/birthdays' }]} />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: t('title', { month: monthName }),
                url: `${SITE_URL}${href('birthdays', undefined, locale)}`,
            }} />

            {/* Header */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-8">
                    <div className="flex items-end gap-4 mt-4">
                        <div>
                            <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">
                                {t('kicker')}
                            </p>
                            <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                                {monthName}
                            </h1>
                        </div>
                        <span className="font-serif text-[64px] sm:text-[80px] italic font-black leading-none text-accent/20 mb-1">
                            {currentYear}
                        </span>
                    </div>
                    <p className="font-mono text-[11px] text-muted mt-2">
                        {t('count', { count: withBirthday.length, month: monthName })}
                    </p>
                </div>
            </div>

            {/* Month tabs */}
            <div className="border-b border-border bg-surface/40">
                <div className="page-wrap">
                    <div className="flex gap-0.5 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
                        {MONTH_NAMES.map((m, i) => {
                            const mn = i + 1
                            const isActive = mn === currentMonth
                            const isCurrentRealMonth = mn === (now.getMonth() + 1)
                            return (
                                <Link key={mn} href={isCurrentRealMonth ? '/artists/birthdays' : `/artists/birthdays?month=${mn}`}
                                    className={`shrink-0 px-3 py-1.5 font-mono text-[11px] font-bold rounded-xs transition-colors ${
                                        isActive ? 'bg-accent-a11y text-white' : 'text-muted hover:text-foreground hover:bg-surface'
                                    }`}>
                                    {m.slice(0, 3)}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="page-wrap py-8">
                {loja && withBirthday.length > 0 && (
                    <LojaEmLinha bloco="aniversarios-loja" products={shopProducts} title="Presente para o aniversário do seu bias" contexto="aniversarios:topo" className="mb-8" />
                )}
                {withBirthday.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <Cake size={48} className="text-muted/20 mb-4" />
                        <p className="text-[16px] font-bold mb-1">{t('emptyTitle')}</p>
                        <p className="text-[13px] text-muted">{t('emptyDesc', { month: monthName })}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Array.from(byDay.entries()).map(([day, dayArtists], indice) => {
                            const isCurrentMonth = currentMonth === (now.getMonth() + 1)
                            const isToday = isCurrentMonth && day === now.getUTCDate()
                            return (
                                <Fragment key={day}>
                                {/* A cada 6 dias: ~9.000px de rolagem no celular sem anúncio nenhum até 2026-09-17.
                                    De 4 em 4 deu 6 anúncios (um a cada 1.500px), denso para uma lista de fotos. */}
                                {indice > 0 && indice % 6 === 0 && ADSENSE.slots.inline && (
                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="aniversariantes" />
                                )}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`font-black text-[32px] leading-none tabular-nums w-12 text-right ${isToday ? 'text-accent' : 'text-muted/30'}`}>
                                            {day}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                        {isToday && (
                                            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-accent uppercase tracking-[0.06em]">
                                                <Cake size={11} /> {t('today')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pl-15">
                                        {dayArtists.map(artist => (
                                            <Link key={artist.id} href={`/artists/${artist.slug}`}
                                                className="group flex flex-col items-center text-center">
                                                <div className={`relative w-full aspect-square overflow-hidden rounded-full mb-2 bg-surface ${isToday ? 'ring-2 ring-accent ring-offset-2' : ''}`}>
                                                    {artist.image ? (
                                                        <Image src={artist.image.src} alt={artist.image.alt || artist.name} fill
                                                            className="object-cover object-top group-hover:scale-[1.05] transition-transform duration-500"
                                                            sizes="(max-width: 640px) 25vw, 12vw" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                                            <span className="text-[24px] font-black text-accent/40">{artist.name[0]}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[12px] font-semibold leading-tight group-hover:text-accent transition-colors line-clamp-2">
                                                    {artist.name}
                                                </span>
                                                {artist.age && (
                                                    <span className="font-mono text-[10px] text-muted mt-0.5">{t('age', { age: artist.age })}</span>
                                                )}
                                                {artist.hangul && (
                                                    <span className="font-mono text-[10px] text-muted/60">{artist.hangul}</span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                </Fragment>
                            )
                        })}
                    </div>
                )}

                {quiz && <QuizWidget category="all" title="Sabe quem mais faz aniversário este mês?" description="Teste seu conhecimento sobre os artistas do acervo" />}
            </div>
        </>
    )
}

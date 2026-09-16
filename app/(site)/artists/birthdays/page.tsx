import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Cake } from 'lucide-react'
import { getArtists } from '@/lib/wordpress/artists'
import { SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { JsonLd } from '@/components/seo/JsonLd'

export const revalidate = 3600

const MONTH_NAMES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

type SearchParams = Promise<{ month?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const month = Math.min(12, Math.max(1, parseInt(sp.month ?? '0', 10) || new Date().getMonth() + 1))
    const monthName = MONTH_NAMES[month - 1]
    return {
        title: `Aniversários de ${monthName}`,
        description: `Artistas K-Pop e K-Drama que fazem aniversário em ${monthName}.`,
        alternates: { canonical: `${SITE_URL}/artists/birthdays` },
        robots: { index: true, follow: true },
    }
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

export default async function BirthdaysPage({ searchParams }: { searchParams: SearchParams }) {
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

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Aniversários de ${monthName}`,
                url: `${SITE_URL}/artists/birthdays`,
            }} />

            {/* Header */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-8">
                    <div className="flex items-end gap-4 mt-4">
                        <div>
                            <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">
                                Aniversários
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
                        {withBirthday.length} artista{withBirthday.length !== 1 ? 's' : ''} fazem aniversário em {monthName}
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
                {withBirthday.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <Cake size={48} className="text-muted/20 mb-4" />
                        <p className="text-[16px] font-bold mb-1">Nenhum aniversário encontrado</p>
                        <p className="text-[13px] text-muted">Sem artistas cadastrados com aniversário em {monthName}.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Array.from(byDay.entries()).map(([day, dayArtists]) => {
                            const isCurrentMonth = currentMonth === (now.getMonth() + 1)
                            const isToday = isCurrentMonth && day === now.getUTCDate()
                            return (
                                <div key={day}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`font-black text-[32px] leading-none tabular-nums w-12 text-right ${isToday ? 'text-accent' : 'text-muted/30'}`}>
                                            {day}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                        {isToday && (
                                            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-accent uppercase tracking-[0.06em]">
                                                <Cake size={11} /> Hoje
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
                                                    <span className="font-mono text-[10px] text-muted mt-0.5">{artist.age} anos</span>
                                                )}
                                                {artist.hangul && (
                                                    <span className="font-mono text-[9px] text-muted/60">{artist.hangul}</span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

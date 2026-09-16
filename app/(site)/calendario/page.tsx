import type { Metadata } from 'next'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { CalendarPage } from '@/components/features/CalendarPage'
import { SITE_URL } from '@/lib/constants/site'
import { parseAcfDate, stripHtml, getWPImage } from '@/lib/utils'

export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Calendário K-Pop',
    description: 'Aniversários de idols e datas de debut de grupos K-Pop. Fique por dentro dos próximos eventos.',
    alternates: { canonical: `${SITE_URL}/calendario` },
}

export type CalendarEvent = {
    id: number
    day: number
    month: number
    year: number
    date: string // YYYY-MM-DD (ano do evento, pode ser próximo ano)
    daysUntil: number // 0 = hoje, negativo = passado (neste mês)
    type: 'birthday' | 'debut'
    name: string
    slug: string
    href: string
    image: { src: string; alt: string } | null
    extra?: string
}

export default async function CalendarioPage() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const todayStr = now.toISOString().slice(0, 10)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Busca artistas dos 3 meses: mês atual + próximos 2
    const months = [0, 1, 2].map(offset => {
        const m = currentMonth + offset
        return m > 12 ? m - 12 : m
    })

    // WP API max per_page = 100; grupos têm 2 páginas (~161 total)
    const [artistResults, groupPage1, groupPage2] = await Promise.all([
        Promise.all(months.map(m =>
            getArtists({ birthMonth: m, perPage: 100, orderby: 'date', order: 'desc' })
        )),
        getGroups({ perPage: 100, page: 1, orderby: 'date', order: 'desc' }),
        getGroups({ perPage: 100, page: 2, orderby: 'date', order: 'desc' }),
    ])
    const groups = [...groupPage1.items, ...groupPage2.items]

    const allArtists = artistResults.flatMap((r) => r.items)
    const seenArtists = new Set<number>()
    const uniqueArtists = allArtists.filter(a => {
        if (seenArtists.has(a.id)) return false
        seenArtists.add(a.id)
        return true
    })

    const events: CalendarEvent[] = []

    // Aniversários
    for (const artist of uniqueArtists) {
        const raw = artist.acf?.birth_date
        if (!raw || artist.acf?.death_date) continue // falecido não gera aniversário
        try {
            const d = parseAcfDate(raw)
            const birthMonth = d.getMonth() + 1
            const birthDay = d.getDate()

            // Próxima ocorrência deste aniversário
            let eventYear = currentYear
            let eventDate = new Date(currentYear, birthMonth - 1, birthDay)
            eventDate.setHours(0, 0, 0, 0)
            if (eventDate < now) {
                eventYear = currentYear + 1
                eventDate = new Date(currentYear + 1, birthMonth - 1, birthDay)
                eventDate.setHours(0, 0, 0, 0)
            }

            const daysUntil = Math.round((eventDate.getTime() - now.getTime()) / 86400000)
            if (daysUntil > 90) continue

            const age = eventYear - d.getFullYear()
            const dateStr = `${eventYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`

            events.push({
                id: artist.id,
                day: birthDay, month: birthMonth, year: eventYear,
                date: dateStr, daysUntil,
                type: 'birthday',
                name: stripHtml(artist.title.rendered),
                slug: artist.slug,
                href: `/artists/${artist.slug}`,
                image: getWPImage(artist._embedded, artist.featured_image_url),
                extra: `${age} anos`,
            })
        } catch { /* skip */ }
    }

    // Debuts
    for (const group of groups) {
        const raw = group.acf?.debut_date
        if (!raw) continue
        try {
            const d = parseAcfDate(raw)
            const debutMonth = d.getMonth() + 1
            const debutDay = d.getDate()

            let eventYear = currentYear
            let eventDate = new Date(currentYear, debutMonth - 1, debutDay)
            eventDate.setHours(0, 0, 0, 0)
            if (eventDate < now) {
                eventYear = currentYear + 1
                eventDate = new Date(currentYear + 1, debutMonth - 1, debutDay)
                eventDate.setHours(0, 0, 0, 0)
            }

            const daysUntil = Math.round((eventDate.getTime() - now.getTime()) / 86400000)
            if (daysUntil > 90) continue

            const years = eventYear - d.getFullYear()
            const dateStr = `${eventYear}-${String(debutMonth).padStart(2, '0')}-${String(debutDay).padStart(2, '0')}`

            events.push({
                id: group.id,
                day: debutDay, month: debutMonth, year: eventYear,
                date: dateStr, daysUntil,
                type: 'debut',
                name: stripHtml(group.title.rendered),
                slug: group.slug,
                href: `/groups/${group.slug}`,
                image: getWPImage(group._embedded, group.featured_image_url, stripHtml(group.title.rendered)),
                extra: years === 0 ? 'Estreia' : `${years} anos de debut`,
            })
        } catch { /* skip */ }
    }

    events.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name))

    return <CalendarPage events={events} todayStr={todayStr} />
}

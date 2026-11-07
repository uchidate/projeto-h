import { temRecurso } from '@/lib/i18n/recursos'
import type { Metadata } from 'next'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { CalendarPage } from '@/components/features/CalendarPage'
import { compartilhamento } from '@/lib/constants/site'
import { parseAcfDate, stripHtml, getWPImage } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/calendario/tipos'
import { getVitrineGeral } from '@/lib/wordpress/vitrine'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { buildAlternates } from '@/lib/i18n/alternates'


/** O calendário existe em português e inglês. */
const IDIOMAS_DO_CALENDARIO: readonly Locale[] = ['pt', 'en']

export async function generateMetadata({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.calendar' })
    return {
        title: t('metaTitulo'),
        description: t('metaDescricao'),
        alternates: buildAlternates('calendar', undefined, locale, IDIOMAS_DO_CALENDARIO),
        ...compartilhamento({
            titulo: t('metaTitulo'),
            descricao: t('metaDescricaoCurta'),
            caminho: href('calendar', undefined, locale),
        }),
    }
}

export default async function CalendarioPage({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
    const t = await getTranslations({ locale, namespace: 'client.calendar' })
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
                href: href('artist', { slug: artist.slug }, locale),
                image: getWPImage(artist._embedded, artist.featured_image_url),
                extra: t('idade', { n: age }),
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
                href: href('group', { slug: group.slug }, locale),
                image: getWPImage(group._embedded, group.featured_image_url, stripHtml(group.title.rendered)),
                extra: years === 0 ? t('estreia') : t('anosDebut', { n: years }),
            })
        } catch { /* skip */ }
    }

    // A loja só existe em português (preços em reais, afiliado brasileiro).
    const shopProducts = locale === DEFAULT_LOCALE ? await getVitrineGeral('calendario', 6, 'kpop') : []
    events.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name))

    return (
        <>
            <PageBreadcrumb items={[{ name: t('breadcrumb'), path: href('calendar', undefined, locale) }]} />
            <CalendarPage events={events} todayStr={todayStr} />
            <div className="page-wrap pb-10">
                {temRecurso('loja', locale) && <LojaEmLinha bloco="calendario-loja" products={shopProducts} title="Presente para o aniversário do seu bias" contexto="calendario:meio" />}
                <QuizWidget category="k-pop" />
            </div>
        </>
    )
}

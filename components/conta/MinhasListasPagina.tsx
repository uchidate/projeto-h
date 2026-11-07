import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserFavorites, getUserWatchlist, getUserProductionStatuses } from '@/lib/wordpress/userApi'
import { getProductionsByIds } from '@/lib/wordpress/productions'
import { MinhasListasClient } from '@/components/features/MinhasListasClient'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export async function metadataDaPagina(locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.minhasListas' })
    return { title: t('title'), robots: { index: false, follow: true } }
}

export default async function MinhasListasPage({
    locale,
    searchParams,
}: {
    locale: Locale
    searchParams: Promise<{ tab?: string }>
}) {
    const session = await getServerSession(authOptions)
    if (!session) redirect(`${href('login', undefined, locale)}?callbackUrl=${href('myLists', undefined, locale)}`)

    const { tab } = await searchParams
    const token = await getWpToken()

    const [favoriteIds, watchlistIds, productionStatuses] = await Promise.all([
        getUserFavorites(token).catch(() => [] as number[]),
        getUserWatchlist(token).catch(() => [] as number[]),
        getUserProductionStatuses(token).catch(() => ({ statuses: {}, counts: { want: 0, watching: 0, watched: 0 } })),
    ])
    const statusEntries = Object.entries(productionStatuses.statuses)
        .map(([id, status]) => ({ id: Number(id), status }))
        .filter(entry => Number.isFinite(entry.id))
    const watchingIds = statusEntries.filter(entry => entry.status === 'watching').map(entry => entry.id).reverse()
    const watchedIds = statusEntries.filter(entry => entry.status === 'watched').map(entry => entry.id).reverse()

    const [favProductions, watchProductions, watchingProductions, watchedProductions] = await Promise.all([
        favoriteIds.length > 0 ? getProductionsByIds([...favoriteIds].reverse()).catch(() => []) : Promise.resolve([]),
        watchlistIds.length > 0 ? getProductionsByIds([...watchlistIds].reverse()).catch(() => []) : Promise.resolve([]),
        watchingIds.length > 0 ? getProductionsByIds(watchingIds).catch(() => []) : Promise.resolve([]),
        watchedIds.length > 0 ? getProductionsByIds(watchedIds).catch(() => []) : Promise.resolve([]),
    ])

    const initialTab = tab === 'lista' || tab === 'assistindo' || tab === 'assistidos' || tab === 'favoritos'
        ? tab
        : 'favoritos'

    return (
        <MinhasListasClient
            initialTab={initialTab}
            favProductions={favProductions}
            watchProductions={watchProductions}
            watchingProductions={watchingProductions}
            watchedProductions={watchedProductions}
            favoriteIds={favoriteIds}
            watchlistIds={watchlistIds}
            watchingIds={watchingIds}
            watchedIds={watchedIds}
        />
    )
}

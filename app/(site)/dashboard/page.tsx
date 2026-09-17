import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserStats, getUserFavorites, getUserWatchlist, getUserContentStates, getUserProductionStatuses } from '@/lib/wordpress/userApi'
import { getProductionsByIds } from '@/lib/wordpress/productions'
import { getPosts } from '@/lib/wordpress/posts'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroupsByIds } from '@/lib/wordpress/groups'
import { DashboardClient } from '@/components/features/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Minha Onda',
    robots: { index: false, follow: true },
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/entrar?callbackUrl=/dashboard')

    const token = await getWpToken()
    const [stats, favoriteIds, watchlistIds, latestPosts, contentStates, productionStatuses] = await Promise.all([
        getUserStats(token).catch(() => ({ favoritesCount: 0, watchlistCount: 0, joinDate: '' })),
        getUserFavorites(token).catch(() => [] as number[]),
        getUserWatchlist(token).catch(() => [] as number[]),
        getPosts({ perPage: 4 }).catch(() => ({ items: [], total: 0, totalPages: 0 })),
        getUserContentStates(token).catch(() => ({ states: [], counts: { production: 0, artist: 0, group: 0, post: 0 }, countsByState: { favorite: 0, following: 0, saved: 0, read: 0 } })),
        getUserProductionStatuses(token).catch(() => ({ statuses: {}, counts: { want: 0, watching: 0, watched: 0 } })),
    ])

    // Busca detalhes das produções favoritas (até 6)
    const recentFavIds = favoriteIds.slice(-6).reverse()
    const recentWatchIds = watchlistIds.slice(-6).reverse()
    const watchingIds = Object.entries(productionStatuses.statuses)
        .filter(([, status]) => status === 'watching')
        .map(([id]) => Number(id))
        .filter(Number.isFinite)
        .reverse()
        .slice(0, 6)
    const savedPostIds = contentStates.states
        .filter(entry => entry.objectType === 'post' && entry.state === 'saved')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .map(entry => entry.objectId)
        .slice(0, 4)
    const readPostIds = contentStates.states
        .filter(entry => entry.objectType === 'post' && entry.state === 'read')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .map(entry => entry.objectId)
        .filter(id => !savedPostIds.includes(id))
        .slice(0, 4)
    const followedArtistIds = contentStates.states
        .filter(entry => entry.objectType === 'artist' && entry.state === 'following')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .map(entry => entry.objectId)
        .slice(0, 6)
    const followedGroupIds = contentStates.states
        .filter(entry => entry.objectType === 'group' && entry.state === 'following')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .map(entry => entry.objectId)
        .slice(0, 6)

    const [favProductions, watchProductions, watchingProductions, savedPosts, readPosts, followedArtists, followedGroups] = await Promise.all([
        recentFavIds.length > 0 ? getProductionsByIds(recentFavIds).catch(() => []) : Promise.resolve([]),
        recentWatchIds.length > 0 ? getProductionsByIds(recentWatchIds).catch(() => []) : Promise.resolve([]),
        watchingIds.length > 0 ? getProductionsByIds(watchingIds).catch(() => []) : Promise.resolve([]),
        savedPostIds.length > 0 ? getPosts({ includeIds: savedPostIds, perPage: savedPostIds.length }).then(res => {
            const order = new Map(savedPostIds.map((id, index) => [id, index]))
            return res.items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        }).catch(() => []) : Promise.resolve([]),
        readPostIds.length > 0 ? getPosts({ includeIds: readPostIds, perPage: readPostIds.length }).then(res => {
            const order = new Map(readPostIds.map((id, index) => [id, index]))
            return res.items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        }).catch(() => []) : Promise.resolve([]),
        followedArtistIds.length > 0 ? getArtistsByIds(followedArtistIds).then(items => {
            const order = new Map(followedArtistIds.map((id, index) => [id, index]))
            return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        }).catch(() => []) : Promise.resolve([]),
        followedGroupIds.length > 0 ? getGroupsByIds(followedGroupIds).then(items => {
            const order = new Map(followedGroupIds.map((id, index) => [id, index]))
            return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        }).catch(() => []) : Promise.resolve([]),
    ])

    const daysSinceJoin = stats.joinDate
        // This is a request-time Server Component calculation, not client render state.
        // eslint-disable-next-line react-hooks/purity -- Server Component: o cálculo acontece uma vez por requisição, não em render de cliente
        ? Math.max(0, Math.floor((Date.now() - new Date(stats.joinDate).getTime()) / 86400000))
        : null

    return (
        <DashboardClient
            user={{
                name: session.user.name ?? '',
                email: session.user.email ?? '',
                image: session.user.image ?? null,
            }}
            stats={{ ...stats, daysSinceJoin }}
            favProductions={favProductions}
            watchProductions={watchProductions}
            watchingProductions={watchingProductions}
            savedPosts={savedPosts}
            readPosts={readPosts}
            followedArtists={followedArtists}
            followedGroups={followedGroups}
            latestPosts={latestPosts.items}
        />
    )
}

import { WORDPRESS_API_FALLBACK } from '@/lib/constants/site'

const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL ?? WORDPRESS_API_FALLBACK

export type ProductionStatus = '' | 'want' | 'watching' | 'watched'
export type ContentObjectType = 'production' | 'artist' | 'group' | 'post'
export type ContentState = '' | 'favorite' | 'following' | 'saved' | 'read' | ProductionStatus
export type UserContentStateEntry = {
    objectId: number
    objectType: ContentObjectType
    state: Exclude<ContentState, ''>
    updatedAt?: string | null
}
export type UserNotification = {
    id: string
    type: string
    title: string
    body: string
    href: string
    objectType: ContentObjectType
    objectId: number
    priority: 'normal' | 'high' | string
    createdAt: string
    readAt?: string | null
    dismissedAt?: string | null
}
export type NotificationPreferences = {
    savedReadings: boolean
    watching: boolean
}

/**
 * Uma função para os dois lados.
 *
 * No browser não existe mais token: a chamada vai para /api/user/*, que se
 * autentica pelo cookie de sessão e carimba o X-OC-Token no servidor. No
 * servidor (Server Component, route handler) o token vem do JWT e a chamada é
 * direta ao WordPress, sem salto extra.
 */
async function wpUser<T>(path: string, token: string | null | undefined, options: RequestInit = {}): Promise<T> {
    const isBrowser = typeof window !== 'undefined'
    const url = isBrowser ? `/api/user${path}` : `${WP_BASE}/oc/v1${path}`

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'X-OC-Token': token } : {}),
            ...(options.headers ?? {}),
        },
        cache: 'no-store',
    })
    if (!res.ok) throw new Error(`WP user API ${path}: ${res.status}`)
    return res.json()
}

export async function getUserStats(token?: string | null) {
    return wpUser<{
        favoritesCount: number
        watchlistCount: number
        statusCounts?: { want: number; watching: number; watched: number }
        contentCounts?: { production: number; artist: number; group: number; post: number }
        contentStateCounts?: { favorite: number; following: number; saved: number; read: number }
        joinDate: string
        profileCompletion?: number
        profileTasks?: { label: string; done: boolean }[]
    }>('/user/stats', token)
}

export async function getUserFavorites(token?: string | null): Promise<number[]> {
    return wpUser<number[]>('/user/favorites', token)
}

export async function getUserWatchlist(token?: string | null): Promise<number[]> {
    return wpUser<number[]>('/user/watchlist', token)
}

export async function toggleFavorite(token: string | null | undefined, productionId: number) {
    return wpUser<{ action: 'added' | 'removed'; total: number }>('/user/favorites', token, {
        method: 'POST',
        body: JSON.stringify({ production_id: productionId }),
    })
}

export async function toggleWatchlist(token: string | null | undefined, productionId: number) {
    return wpUser<{ action: 'added' | 'removed'; total: number }>('/user/watchlist', token, {
        method: 'POST',
        body: JSON.stringify({ production_id: productionId }),
    })
}

export async function getProductionStatus(token: string | null | undefined, productionId: number) {
    return wpUser<{ productionId: number; status: ProductionStatus }>(`/user/production-status?production_id=${productionId}`, token)
}

export async function getUserProductionStatuses(token?: string | null) {
    return wpUser<{
        statuses: Record<string, Exclude<ProductionStatus, ''>>
        counts: { want: number; watching: number; watched: number }
    }>('/user/production-status', token)
}

export async function setProductionStatus(token: string | null | undefined, productionId: number, status: ProductionStatus) {
    return wpUser<{ productionId: number; status: ProductionStatus; counts: { want: number; watching: number; watched: number } }>('/user/production-status', token, {
        method: 'POST',
        body: JSON.stringify({ production_id: productionId, status }),
    })
}

export async function getContentState(token: string | null | undefined, objectType: ContentObjectType, objectId: number, state: Exclude<ContentState, ''>) {
    return wpUser<{ objectId: number; objectType: ContentObjectType; state: ContentState; updatedAt?: string | null }>(
        `/user/content-state?object_type=${objectType}&object_id=${objectId}&state=${state}`,
        token,
    )
}

export async function getUserContentStates(token?: string | null) {
    return wpUser<{
        states: UserContentStateEntry[]
        counts: { production: number; artist: number; group: number; post: number }
        countsByState: { favorite: number; following: number; saved: number; read: number }
    }>('/user/content-state', token)
}

export async function setContentState(token: string | null | undefined, objectType: ContentObjectType, objectId: number, state: ContentState, removeState?: Exclude<ContentState, ''>) {
    const body = state
        ? { object_type: objectType, object_id: objectId, state }
        : { object_type: objectType, object_id: objectId, state: '', remove_state: removeState }
    return wpUser<{
        objectId: number
        objectType: ContentObjectType
        state: ContentState
        counts: { production: number; artist: number; group: number; post: number }
        countsByState: { favorite: number; following: number; saved: number; read: number }
    }>('/user/content-state', token, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

export async function getUserNotifications(token?: string | null) {
    return wpUser<{ items: UserNotification[]; unreadCount: number }>('/user/notifications', token)
}

export async function updateUserNotification(token: string | null | undefined, id: string, action: 'read' | 'dismiss') {
    return wpUser<{ ok: boolean; items: UserNotification[]; unreadCount: number }>('/user/notifications', token, {
        method: 'POST',
        body: JSON.stringify({ id, action }),
    })
}

export async function markAllUserNotificationsRead(token?: string | null) {
    return wpUser<{ ok: boolean; items: UserNotification[]; unreadCount: number }>('/user/notifications', token, {
        method: 'POST',
        body: JSON.stringify({ action: 'read_all' }),
    })
}

export async function getNotificationPreferences(token?: string | null) {
    return wpUser<NotificationPreferences>('/user/notification-preferences', token)
}

export async function updateNotificationPreferences(token: string | null | undefined, data: Partial<NotificationPreferences>) {
    return wpUser<NotificationPreferences>('/user/notification-preferences', token, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function updateProfile(token: string | null | undefined, data: { name?: string; bio?: string }) {
    return wpUser<{ ok: boolean; name: string; bio: string }>('/user/profile', token, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function registerUser(data: { name: string; email: string; password: string }) {
    const res = await fetch(`${WP_BASE}/oc/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        cache: 'no-store',
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Erro ao criar conta')
    return json as { token: string; userId: number; name: string; email: string; avatar: string }
}

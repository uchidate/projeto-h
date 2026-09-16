import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import type { AdPlacement } from '@/lib/config/ads'
import { WP_API_URL } from './config'

export type MonetizationSettings = {
    enabled: boolean
    client: string
    slots: Record<AdPlacement, string>
    /**
     * ID próprio por `analyticsPlacement` (ex.: `artists_grid` → `1234567890`).
     * Opcional: sem entrada, a posição usa o slot genérico de `slots`. Um ID por
     * posição é o que faz o relatório do AdSense mostrar receita/RPM por posição —
     * com 5 IDs compartilhados por ~30 posições, só o preenchimento era visível.
     */
    placements?: Record<string, string>
}

const PLACEMENT_NAME = /^[a-z0-9_]{1,64}$/
const SLOT_ID = /^\d{6,20}$/

export function sanitizePlacements(raw: unknown): Record<string, string> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(
        Object.entries(raw as Record<string, unknown>).filter(
            ([name, id]) => PLACEMENT_NAME.test(name) && typeof id === 'string' && SLOT_ID.test(id),
        ),
    ) as Record<string, string>
}

const DISABLED: MonetizationSettings = {
    enabled: false,
    client: '',
    slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
}

const MAX_RETRIES = 2

export async function getMonetizationSettings(attempt = 0): Promise<MonetizationSettings> {
    const url = `${WP_API_URL}/${WP_API_NAMESPACE}/monetization`
    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            // revalidação real vem do webhook (revalidateTag em /api/revalidate); 3600s é só o teto de segurança
            next: { revalidate: 3600, tags: ['monetization'] },
            signal: AbortSignal.timeout(15_000),
        })

        if (!response.ok) {
            console.error(`WordPress API error: ${response.status} ${response.statusText} — ${url}`)
            return DISABLED
        }

        const data = await response.json() as Partial<MonetizationSettings>
        if (!data.enabled || !/^ca-pub-\d{16}$/.test(data.client ?? '')) return DISABLED

        return {
            enabled: true,
            client: data.client ?? '',
            slots: {
                inline: data.slots?.inline ?? '',
                article_sidebar: data.slots?.article_sidebar ?? '',
                post_suggestion: data.slots?.post_suggestion ?? '',
                leaderboard: data.slots?.leaderboard ?? '',
                sticky: data.slots?.sticky ?? '',
            },
            placements: sanitizePlacements(data.placements),
        }
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000
            console.warn(`WordPress API timeout — ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
            await new Promise((r) => setTimeout(r, delay))
            return getMonetizationSettings(attempt + 1)
        }
        console.error(`WordPress API unavailable — ${url}`, error)
        return DISABLED
    }
}

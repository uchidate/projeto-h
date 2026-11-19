import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { wpBuscarOpcional } from './client'
import { WP_CACHE_TAGS } from './cache'
import type { Receita } from '@/lib/receitas/tipos'

/** Uma tradução publicada da receita, no formato do campo `translations` do REST (`_oc_i18n` do CPT receita). */
export type TraducaoWPDaReceita = {
    acf?: { yield?: string; ingredients?: Array<{ item?: string; quantity?: string }>; steps?: string[]; tips?: string[] }
    /** O português mudou depois da tradução: não usar. */
    stale?: boolean
}

/** Receita do CPT `receita` (endpoint hallyuhub/v1/receitas): slug = slug da comida. */
export type ReceitaWP = Receita & { slug: string; translations?: Partial<Record<string, TraducaoWPDaReceita>> }

/**
 * Todas as receitas publicadas. Etiquetadas com a coleção de comidas: o WordPress revalida a comida de mesmo slug
 * quando a receita muda, o que invalida esta lista junto.
 */
export async function getReceitasWP(): Promise<ReceitaWP[]> {
    try {
        const r = await wpBuscarOpcional<ReceitaWP[]>(`/${WP_API_NAMESPACE}/receitas`, { revalidate: 3600, tags: [WP_CACHE_TAGS.foods] })
        return Array.isArray(r) ? r.filter((x) => typeof x?.slug === 'string') : []
    } catch {
        return []
    }
}

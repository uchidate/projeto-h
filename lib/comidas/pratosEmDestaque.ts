import type { FoodCategory, WPFood } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'

export type PratoEmDestaque = {
    slug: string
    nome: string
    coreano: string | null
    imagem: string
    categoria: FoodCategory | null
    /** Primeira curiosidade da ficha (ou o resumo), no tamanho de uma linha de vitrine. */
    gancho: string | null
}

function encurtar(texto: string, max: number) {
    const limpo = stripHtml(texto).replace(/\s+/g, ' ').trim()
    if (limpo.length <= max) return limpo
    const corte = limpo.slice(0, max)
    const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('; '), corte.lastIndexOf(' — '))
    return fim > max * 0.5 ? corte.slice(0, fim + 1).trim() : `${corte.slice(0, corte.lastIndexOf(' ')).trim()}…`
}

/** Pratos mais famosos: maior `trending_score` entre os que têm foto. Sem pontuação, nem entram. */
export function pratosEmDestaque(pratos: WPFood[], limite = 7): PratoEmDestaque[] {
    return pratos
        .filter(p => p.featured_image_url && (p.acf?.trending_score ?? 0) > 0)
        .sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))
        .slice(0, limite)
        .map((p, i) => {
            const fonte = p.acf?.curiosidades?.[0] ?? (p.excerpt?.rendered ?? '')
            return {
                slug: p.slug,
                nome: stripHtml(p.title.rendered),
                coreano: p.acf?.name_korean ?? null,
                imagem: p.featured_image_url as string,
                categoria: p.acf?.category ?? null,
                gancho: fonte ? encurtar(fonte, i === 0 ? 220 : 130) : null,
            }
        })
}

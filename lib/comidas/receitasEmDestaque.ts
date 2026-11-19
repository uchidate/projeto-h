import type { Receita } from '@/lib/receitas/tipos'
import { stripHtml } from '@/lib/utils'

function minutosEmTexto(min: number) {
    if (min >= 60) return `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`
    return `${min} min`
}

/** Pratos com receita no idioma (`mapa`, de todasReceitas) que existem no acervo, com foto. Tempo longo demais (marinada, molho) não vira rótulo. */
export function receitasEmDestaque(itens: { slug: string; title: { rendered: string }; featured_image_url?: string | null }[], mapa: Record<string, Receita>, limite = 4) {
    return itens
        .filter(i => i.featured_image_url && mapa[i.slug])
        .slice(0, limite)
        .map(i => {
            const r = mapa[i.slug]
            const total = (r.preparoMin ?? 0) + (r.cozimentoMin ?? 0)
            return { slug: i.slug, nome: stripHtml(i.title.rendered), imagem: i.featured_image_url as string, tempo: total > 0 && total <= 240 ? minutosEmTexto(total) : null }
        })
}

import type { WPPost, WPTerm } from '@/lib/wordpress/types'

// Cores por categoria vêm de CSS custom properties (--home-cat-*, ver
// styles/globals.css) em vez de hex fixo — precisam de um valor diferente por
// tema pra passar WCAG AA (4.5:1) contra o fundo translúcido da própria cor
// (achado via axe-core em 2026-07-06: a paleta original em hex fixo falhava
// em 9 das 10 categorias, pior caso 1.87:1 em "reality-shows" no tema claro).
const KNOWN_SLUGS = [
    'k-drama', 'k-pop', 'k-film', 'cultura', 'grupos',
    'k-beauty', 'artistas', 'noticias-k-pop', 'reality-shows', 'webtoons',
] as const

function catVar(slug: string): string {
    return `var(--home-cat-${slug})`
}

function resolveCategory(post: WPPost, categoryMap?: Record<number, { name: string; slug: string }>): { name: string; slug: string } | null {
    // Prefer _embedded terms (when _embed=true was used)
    const embedded = (post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[]
    if (embedded[0]) return { name: embedded[0].name, slug: embedded[0].slug }
    // Fallback: resolve via categoryMap using post.categories IDs
    if (categoryMap && post.categories?.length) {
        const cat = categoryMap[post.categories[0]]
        if (cat) return cat
    }
    return null
}

export function homeCatStyle(post: WPPost, categoryMap?: Record<number, { name: string; slug: string }>): { color: string; bg: string } {
    const cat = resolveCategory(post, categoryMap)
    const slug = cat && (KNOWN_SLUGS as readonly string[]).includes(cat.slug) ? cat.slug : 'k-drama'
    const color = catVar(slug)
    return { color, bg: `color-mix(in srgb, ${color} 12.5%, transparent)` }
}

export function homeCatName(post: WPPost, categoryMap?: Record<number, { name: string; slug: string }>): string {
    const cat = resolveCategory(post, categoryMap)
    return cat?.name ?? 'Artigo'
}

export function nameToGradient(name: string): string {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    const hue = Math.abs(h) % 360
    return `linear-gradient(135deg, hsl(${hue},55%,16%) 0%, hsl(${(hue + 40) % 360},45%,10%) 100%)`
}

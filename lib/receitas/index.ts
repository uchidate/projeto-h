import dados from '@/data/receitas.json'
import type { Receita } from './tipos'

const RECEITAS = dados as Record<string, Receita>

export function getReceita(slug: string): Receita | null {
    return Object.hasOwn(RECEITAS, slug) ? RECEITAS[slug] : null
}

export function todasReceitas(): Record<string, Receita> {
    return RECEITAS
}

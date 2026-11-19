import { SOURCE_LOCALE } from '@/lib/i18n/config'
import { getReceitasWP, type ReceitaWP } from '@/lib/wordpress/receitas'
import type { Receita } from './tipos'
import { validarReceita } from './validar'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * A receita no idioma, ou `null` se ela não existe nele. Português é a própria; nos outros, a tradução publicada
 * no WordPress substitui o texto (rendimento, ingredientes, passos, dicas) e mantém porções, tempos e fontes.
 * Tradução desatualizada (`stale`) ou com estrutura diferente do português não vale: a receita some do idioma em vez
 * de aparecer com quantidades ou passos que não batem.
 */
export function receitaNoIdioma(r: ReceitaWP, locale: string): Receita | null {
    const { slug: _slug, translations, ...base } = r
    if (locale === SOURCE_LOCALE) return base
    const tr = translations?.[locale]
    if (!tr || tr.stale) return null
    const a = tr.acf ?? {}
    const ingredientes = (a.ingredients ?? []).map((i) => ({ item: texto(i?.item), quantidade: texto(i?.quantity) }))
    const passos = (a.steps ?? []).map(texto)
    const dicas = (a.tips ?? []).map(texto)
    if (ingredientes.length !== base.ingredientes.length || passos.length !== base.passos.length || dicas.length !== (base.dicas ?? []).length) return null
    return {
        ...base,
        ingredientes,
        passos,
        ...(base.dicas && { dicas }),
        ...(base.rendimento && { rendimento: texto(a.yield) || base.rendimento }),
    }
}

/**
 * Receitas no idioma, por slug da comida. Só entra receita que passa em `validarReceita`: o schema Recipe exige que o
 * conteúdo visível esteja completo, e uma receita quebrada no WordPress não deve ir ao ar.
 */
export async function todasReceitas(locale: string = SOURCE_LOCALE): Promise<Record<string, Receita>> {
    const out: Record<string, Receita> = {}
    for (const r of await getReceitasWP()) {
        const rec = receitaNoIdioma(r, locale)
        if (rec && validarReceita(r.slug, rec).length === 0) out[r.slug] = rec
    }
    return out
}

export async function getReceita(slug: string, locale: string = SOURCE_LOCALE): Promise<Receita | null> {
    return (await todasReceitas(locale))[slug] ?? null
}

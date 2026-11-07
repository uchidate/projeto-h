import dados from '@/data/receitas.json'
import dadosEn from '@/data/receitas.en.json'
import type { Receita } from './tipos'

const RECEITAS = dados as Record<string, Receita>
// Mesma estrutura, textos em inglês (traduzidos da versão em português; fontes e tempos iguais).
const RECEITAS_EN = dadosEn as Record<string, Receita>

function doIdioma(locale: string): Record<string, Receita> {
    return locale === 'en' ? RECEITAS_EN : RECEITAS
}

export function getReceita(slug: string, locale = 'pt'): Receita | null {
    const mapa = doIdioma(locale)
    return Object.hasOwn(mapa, slug) ? mapa[slug] : null
}

export function todasReceitas(locale = 'pt'): Record<string, Receita> {
    return doIdioma(locale)
}

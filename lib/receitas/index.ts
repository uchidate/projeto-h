import dados from '@/data/receitas.json'
import dadosEn from '@/data/receitas.en.json'
import dadosJa from '@/data/receitas.ja.json'
import type { Receita } from './tipos'

const RECEITAS = dados as Record<string, Receita>
// Mesma estrutura, textos em inglês (traduzidos da versão em português; fontes e tempos iguais).
const RECEITAS_EN = dadosEn as Record<string, Receita>

// Japonês: mesma estrutura, textos traduzidos do português (fontes e tempos iguais).
const RECEITAS_JA = dadosJa as Record<string, Receita>

function doIdioma(locale: string): Record<string, Receita> {
    if (locale === 'en') return RECEITAS_EN
    if (locale === 'ja') return RECEITAS_JA
    return RECEITAS
}

export function getReceita(slug: string, locale = 'pt'): Receita | null {
    const mapa = doIdioma(locale)
    return Object.hasOwn(mapa, slug) ? mapa[slug] : null
}

export function todasReceitas(locale = 'pt'): Record<string, Receita> {
    return doIdioma(locale)
}

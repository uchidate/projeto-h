import { getHub } from '@/lib/guias'
import { getHubItems } from '@/lib/guias/hub-items'
import { getTranslations } from 'next-intl/server'
import { getPostBySlug } from '@/lib/wordpress/posts'
import { href } from '@/lib/i18n/routes'
import type { BestOfList } from '@/lib/wordpress/site-settings'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { hasLocale } from '@/lib/i18n/entity-translation'
import { localizarGuia, slugPublicoDoGuia, slugsPtTraduzidos } from '@/lib/guias/i18n'

/** Guias por tema da faixa escura: slug do guia em /guias/{slug} e a cor do filete. */
export const GUIAS_POR_TEMA = [
    { slug: 'melhores-doramas-de-todos-os-tempos', cor: '#6d3fc0' },
    { slug: 'doramas-romanticos', cor: '#c0307a' },
    { slug: 'doramas-acao-coreanos', cor: '#b4531a' },
    { slug: 'filmes-coreanos', cor: '#1a5fb4' },
    { slug: 'doramas-coreanos-netflix', cor: '#c61153' },
    { slug: 'doramas-historicos-coreanos', cor: '#0b6b63' },
] as const

export interface GuiaDaHome {
    slug: string
    titulo: string
    cor: string
    total: number
    /** Até três capas, sem repetir entre guias. */
    capas: string[]
}

/** Texto de apoio de cada passo do "Comece aqui", por rótulo; passo sem entrada aqui fica só com o título. */
export const APOIO_DOS_PASSOS: Record<string, string> = {
    'O que é Hallyu?': 'a onda coreana, em poucos minutos',
    'Como começar no K-Pop': 'por onde ouvir primeiro',
    'Idol vs. Artist': 'quem é quem',
    'Posições em um grupo de K-Pop': 'líder, vocal, rapper',
    'Line no K-pop (vocal/dance/maknae)': 'vocal, dance, maknae',
    'Hangeul em 30 minutos': 'leia o alfabeto coreano',
}

/** Três capas por guia, escolhendo as que ainda não apareceram em outro guia (os temas se sobrepõem). */
export function escolherCapas(porGuia: { slug: string; capas: string[] }[], n = 3): Record<string, string[]> {
    const usadas = new Set<string>()
    const out: Record<string, string[]> = {}
    for (const { slug, capas } of porGuia) {
        const novas = capas.filter(c => !usadas.has(c))
        const escolhidas = [...novas, ...capas.filter(c => !novas.includes(c))].slice(0, n)
        escolhidas.forEach(c => usadas.add(c))
        out[slug] = escolhidas
    }
    return out
}

/**
 * Fora do português só entram os guias com texto traduzido; o total e as capas vêm das produções com página no idioma,
 * e o `slug` devolvido é o da URL do idioma.
 */
export async function carregarGuiasPorTema(locale: Locale = DEFAULT_LOCALE): Promise<GuiaDaHome[]> {
    const emPt = locale === DEFAULT_LOCALE
    const traduzidos = new Set(slugsPtTraduzidos(locale))
    const temas = GUIAS_POR_TEMA.filter(g => emPt || traduzidos.has(g.slug))
    const lidos = await Promise.all(temas.map(async ({ slug, cor }) => {
        const original = await getHub(slug)
        const hub = original && (emPt ? original : localizarGuia(original, locale))
        if (!hub || hub.kind !== 'productions') return null
        const r = await getHubItems(hub, { perPage: 8, ...(emPt ? {} : { locale }) })
        if (r.kind !== 'productions') return null
        // Transmissões de show no cinema ("Live Viewing") entram como filme, mas não são o que o guia promete.
        const itens = r.items.filter(p => emPt || hasLocale(p, locale))
        const capas = itens.filter(p => !/live viewing/i.test(p.title.rendered)).map(p => p.featured_image_url).filter((c): c is string => !!c)
        return { slug: slugPublicoDoGuia(slug, locale) ?? slug, titulo: hub.shortTitle || hub.title, cor, total: r.total, capas }
    }))
    const guias = lidos.filter((g): g is NonNullable<typeof g> => g !== null && g.capas.length > 0)
    const capas = escolherCapas(guias)
    return guias.map(g => ({ slug: g.slug, titulo: g.titulo, cor: g.cor, total: g.total, capas: capas[g.slug] }))
}

/**
 * "Comece aqui" fora do português: os passos são os mesmos posts do WP, em outro idioma. Só entra o passo cujo post tem
 * versão publicada no idioma e rótulo em `home.passos` (chave = slug do post em português); o link vai para essa versão.
 */
export async function carregarPassos(passosPt: BestOfList[], locale: Locale): Promise<BestOfList[]> {
    if (locale === DEFAULT_LOCALE) return passosPt
    const t = (await getTranslations({ locale, namespace: 'home.passos' })) as unknown as { has(chave: string): boolean; raw(chave: string): { label: string; apoio?: string } }
    const resolvidos = await Promise.all(passosPt.map(async (p): Promise<BestOfList | null> => {
        const slugPt = p.href.match(/^\/blog\/([^/?#]+)$/)?.[1]
        if (!slugPt || !t.has(slugPt)) return null
        const post = await getPostBySlug(slugPt).catch(() => null)
        const slug = post?.translations?.[locale]
        if (!slug) return null
        const { label, apoio } = t.raw(slugPt)
        return { label, apoio, emoji: p.emoji, href: href('post', { slug }, locale) }
    }))
    return resolvidos.filter((p): p is BestOfList => p !== null)
}

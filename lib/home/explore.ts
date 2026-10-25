import { getAgencies } from '@/lib/wordpress/agencies'
import { getFoods } from '@/lib/wordpress/foods'
import { getPosts } from '@/lib/wordpress/posts'
import type { WPPost } from '@/lib/wordpress/types'

export type UnidadeExplore = 'artigos' | 'fichas'
export type ChaveExplore = 'kpop' | 'cultura' | 'gastronomia' | 'kbeauty' | 'guias' | 'kdrama' | 'kfilm' | 'reality' | 'webtoons' | 'agencias'

interface TemaExplore {
    chave: ChaveExplore
    cor: string
    /** Feed de artigos do tema: categoria ou tag do WP. */
    feed?: { category: string } | { tag: string }
    href: string
    /** Sem foto de matéria: cartão de cor com o hangul. */
    hangul?: string
    unidade: UnidadeExplore
}

/** Os dez assuntos do "Explore por tema", na ordem da página. */
export const TEMAS_EXPLORE: TemaExplore[] = [
    { chave: 'kpop', cor: '#c61153', feed: { category: 'k-pop' }, href: '/blog?category=k-pop', unidade: 'artigos' },
    { chave: 'cultura', cor: '#0b6b63', feed: { category: 'cultura' }, href: '/blog?category=cultura', unidade: 'artigos' },
    { chave: 'gastronomia', cor: '#b4531a', feed: { tag: 'comida-coreana' }, href: '/comidas', unidade: 'fichas' },
    { chave: 'kbeauty', cor: '#a8296b', feed: { category: 'k-beauty' }, href: '/blog?category=k-beauty', unidade: 'artigos' },
    { chave: 'guias', cor: '#0b6b63', feed: { tag: 'guia-para-iniciantes' }, href: '/blog?tag=guia-para-iniciantes', hangul: '가이드', unidade: 'artigos' },
    { chave: 'kdrama', cor: '#6d3fc0', feed: { category: 'k-drama' }, href: '/blog?category=k-drama', unidade: 'artigos' },
    { chave: 'kfilm', cor: '#1a5fb4', feed: { category: 'k-film' }, href: '/blog?category=k-film', unidade: 'artigos' },
    { chave: 'reality', cor: '#8a5a00', feed: { category: 'reality-shows' }, href: '/blog?category=reality-shows', unidade: 'artigos' },
    { chave: 'webtoons', cor: '#107535', feed: { category: 'webtoons' }, href: '/blog?category=webtoons', hangul: '웹툰', unidade: 'artigos' },
    { chave: 'agencias', cor: '#4a4a5a', href: '/agencies', hangul: '기획사', unidade: 'fichas' },
]

export interface CartaoExplore {
    chave: ChaveExplore
    cor: string
    href: string
    hangul?: string
    unidade: UnidadeExplore
    total: number
    ultimo: WPPost | null
    /** Matéria mais recente com menos de dois dias. */
    novo: boolean
}

/** Total e matéria mais recente de cada assunto. Assunto sem total (falha do WP) fica de fora em vez de mostrar zero. */
export async function carregarExplore(): Promise<CartaoExplore[]> {
    const lidos = await Promise.allSettled(TEMAS_EXPLORE.map(async (t): Promise<CartaoExplore> => {
        const base = { chave: t.chave, cor: t.cor, href: t.href, hangul: t.hangul, unidade: t.unidade }
        const posts = t.feed ? await getPosts({ ...t.feed, perPage: 1, includeContent: false }) : null
        const ultimo = posts?.items[0] ?? null
        const novo = ultimo ? Date.now() - new Date(ultimo.date.endsWith('Z') ? ultimo.date : `${ultimo.date}Z`).getTime() < 2 * 86_400_000 : false
        if (t.chave === 'gastronomia') return { ...base, total: (await getFoods({ perPage: 1 })).total, ultimo, novo }
        if (t.chave === 'agencias') return { ...base, total: (await getAgencies({ perPage: 1 })).total, ultimo: null, novo: false }
        return { ...base, total: posts?.total ?? 0, ultimo, novo }
    }))
    return lidos.flatMap(r => (r.status === 'fulfilled' && r.value.total > 0 ? [r.value] : []))
}

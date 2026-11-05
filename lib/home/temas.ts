import { getCompanies } from '@/lib/wordpress/companies'
import { getFoods } from '@/lib/wordpress/foods'
import { getPosts } from '@/lib/wordpress/posts'
import { getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import type { StoreProduct } from '@/lib/wordpress/store'
import type { WPPost } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { localizeEntity } from '@/lib/i18n/entity-translation'

export interface FichaDoTema {
    slug: string
    nome: string
    imagem: string
    /** Produtos vinculados direto na ficha; 0 não é exibido. */
    naLoja: number
}

export interface TemaHome {
    artigos: WPPost[]
    totalArtigos: number
    pratos: FichaDoTema[]
    totalPratos: number
    marcas: FichaDoTema[]
    totalMarcas: number
    prateleira: StoreProduct[]
}

type ComAcf = { id: number; slug: string; title: { rendered: string }; featured_image_url?: string | null; acf?: { linked_products?: number[] } }

/** Só ficha com imagem entra; as com mais produtos vinculados vêm primeiro, depois a ordem recebida. */
export function escolherFichas(itens: ComAcf[], n: number, comLoja = true): FichaDoTema[] {
    const fichas = itens
        .filter(i => !!i.featured_image_url)
        .map(i => ({ slug: i.slug, nome: stripHtml(i.title.rendered), imagem: i.featured_image_url as string, naLoja: comLoja ? (i.acf?.linked_products?.length ?? 0) : 0 }))
    return fichas.map((f, i) => ({ f, i })).sort((a, b) => b.f.naLoja - a.f.naLoja || a.i - b.i).map(x => x.f).slice(0, n)
}

const vazio = <T,>(valor: T) => (r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : valor)

/**
 * Fora do português só entram fichas e artigos com tradução publicada (a loja é em reais, então a prateleira fica vazia).
 * A busca por idioma devolve só o que está traduzido; o nome da ficha vem da versão no idioma.
 */
export async function carregarTemas(locale: Locale = DEFAULT_LOCALE): Promise<{ gastronomia: TemaHome; beleza: TemaHome }> {
    const emPt = locale === DEFAULT_LOCALE
    const lang = emPt ? {} : { lang: locale }
    const idioma = emPt ? {} : { locale }
    const lista = { items: [], total: 0, totalPages: 0 }
    const [postsComida, comidas, empresasComida, prateleiraComida, postsBeleza, empresasBeleza, prateleiraBeleza] = await Promise.allSettled([
        getPosts({ tag: 'comida-coreana', perPage: 2, includeContent: false, ...lang }),
        getFoods({ perPage: 100, ...idioma }),
        getCompanies({ industry: 'food_beverage', perPage: 100, ...idioma }),
        emPt ? getVitrinePorTermos([], 'home_gastronomia', { limit: 5, temas: ['culinaria'] }) : Promise.resolve([]),
        getPosts({ category: 'k-beauty', perPage: 2, includeContent: false, ...lang }),
        getCompanies({ industry: 'beauty', perPage: 100, ...idioma }),
        emPt ? getVitrinePorTermos([], 'home_beleza', { limit: 5, temas: ['beleza'] }) : Promise.resolve([]),
    ])
    const pc = vazio<Awaited<ReturnType<typeof getPosts>>>(lista)(postsComida)
    const pb = vazio<Awaited<ReturnType<typeof getPosts>>>(lista)(postsBeleza)
    const fo = vazio<Awaited<ReturnType<typeof getFoods>>>(lista)(comidas)
    const ec = vazio<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresasComida)
    const eb = vazio<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresasBeleza)
    const pratos = fo.items.map(f => localizeEntity(f, locale, 'food'))
    const empresasDoTema = (itens: typeof ec.items) => itens.map(c => localizeEntity(c, locale, 'company'))
    return {
        gastronomia: {
            artigos: pc.items, totalArtigos: pc.total,
            pratos: escolherFichas(pratos, 2, emPt), totalPratos: fo.total,
            marcas: escolherFichas(empresasDoTema(ec.items), 2, emPt), totalMarcas: ec.total,
            prateleira: vazio<StoreProduct[]>([])(prateleiraComida),
        },
        beleza: {
            artigos: pb.items, totalArtigos: pb.total,
            pratos: [], totalPratos: 0,
            marcas: escolherFichas(empresasDoTema(eb.items), 4, emPt), totalMarcas: eb.total,
            prateleira: vazio<StoreProduct[]>([])(prateleiraBeleza),
        },
    }
}

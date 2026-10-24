import { getCompanies } from '@/lib/wordpress/companies'
import { getFoods } from '@/lib/wordpress/foods'
import { getPosts } from '@/lib/wordpress/posts'
import { getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import type { StoreProduct } from '@/lib/wordpress/store'
import type { WPPost } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'

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
export function escolherFichas(itens: ComAcf[], n: number): FichaDoTema[] {
    const fichas = itens
        .filter(i => !!i.featured_image_url)
        .map(i => ({ slug: i.slug, nome: stripHtml(i.title.rendered), imagem: i.featured_image_url as string, naLoja: i.acf?.linked_products?.length ?? 0 }))
    return fichas.map((f, i) => ({ f, i })).sort((a, b) => b.f.naLoja - a.f.naLoja || a.i - b.i).map(x => x.f).slice(0, n)
}

const vazio = <T,>(valor: T) => (r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : valor)

export async function carregarTemas(): Promise<{ gastronomia: TemaHome; beleza: TemaHome }> {
    const lista = { items: [], total: 0, totalPages: 0 }
    const [postsComida, comidas, empresasComida, prateleiraComida, postsBeleza, empresasBeleza, prateleiraBeleza] = await Promise.allSettled([
        getPosts({ tag: 'comida-coreana', perPage: 2, includeContent: false }),
        getFoods({ perPage: 100 }),
        getCompanies({ industry: 'food_beverage', perPage: 100 }),
        getVitrinePorTermos([], 'home_gastronomia', { limit: 5, temas: ['culinaria'] }),
        getPosts({ category: 'k-beauty', perPage: 2, includeContent: false }),
        getCompanies({ industry: 'beauty', perPage: 100 }),
        getVitrinePorTermos([], 'home_beleza', { limit: 5, temas: ['beleza'] }),
    ])
    const pc = vazio<Awaited<ReturnType<typeof getPosts>>>(lista)(postsComida)
    const pb = vazio<Awaited<ReturnType<typeof getPosts>>>(lista)(postsBeleza)
    const fo = vazio<Awaited<ReturnType<typeof getFoods>>>(lista)(comidas)
    const ec = vazio<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresasComida)
    const eb = vazio<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresasBeleza)
    return {
        gastronomia: {
            artigos: pc.items, totalArtigos: pc.total,
            pratos: escolherFichas(fo.items, 2), totalPratos: fo.total,
            marcas: escolherFichas(ec.items, 2), totalMarcas: ec.total,
            prateleira: vazio<StoreProduct[]>([])(prateleiraComida),
        },
        beleza: {
            artigos: pb.items, totalArtigos: pb.total,
            pratos: [], totalPratos: 0,
            marcas: escolherFichas(eb.items, 4), totalMarcas: eb.total,
            prateleira: vazio<StoreProduct[]>([])(prateleiraBeleza),
        },
    }
}

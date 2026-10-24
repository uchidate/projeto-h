import { getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import type { Tema } from '@/lib/wordpress/store-contexto'
import type { StoreProduct } from '@/lib/wordpress/store'
import type { ChaveEditoria } from '@/lib/home/editorias'

const TEMA_DA_COLUNA: Record<ChaveEditoria, Tema> = { kpop: 'musica', doramas: 'culinaria', cultura: 'beleza' }

export type PrateleirasEditorias = Partial<Record<ChaveEditoria, StoreProduct[]>>

/** Dois produtos por coluna, do tema que combina com ela; coluna sem produto fica sem prateleira. */
export async function carregarPrateleirasEditorias(): Promise<PrateleirasEditorias> {
    const chaves = Object.keys(TEMA_DA_COLUNA) as ChaveEditoria[]
    const lidas = await Promise.allSettled(chaves.map(c => getVitrinePorTermos([], `home_editoria_${c}`, { limit: 2, temas: [TEMA_DA_COLUNA[c]] })))
    return Object.fromEntries(chaves.flatMap((c, i) => {
        const r = lidas[i]
        const itens = r.status === 'fulfilled' ? r.value.filter(p => p.acf.affiliate_url && p.acf.image_url && p.acf.price) : []
        return itens.length ? [[c, itens]] : []
    }))
}

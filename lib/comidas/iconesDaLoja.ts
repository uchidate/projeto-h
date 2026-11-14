import type { StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'

/**
 * Ícones da prateleira coreana: produtos que todo mundo associa à Coreia (doce, snack, sorvete, lámen).
 * Curadoria editorial, em ordem de fama; cada ícone vira UM produto da loja, o melhor ranqueado cujo
 * título contém algum dos termos. Ícone sem produto cadastrado simplesmente não aparece, então
 * cadastrar "Melona" na loja basta para ele entrar na vitrine.
 */
export const ICONES_DA_LOJA: { nome: string; termos: string[] }[] = [
    { nome: 'Choco Pie', termos: ['choco pie'] },
    { nome: 'Melona', termos: ['melona'] },
    { nome: 'Pepero', termos: ['pepero'] },
    { nome: 'Banana Milk', termos: ['banana uyu', 'banana milk', 'leite de banana'] },
    { nome: 'Shin Ramyun', termos: ['shin ramyun', 'shin ramen'] },
    { nome: 'Buldak', termos: ['buldak'] },
    { nome: 'Chapagetti', termos: ['chapagetti', 'jjapaguri', 'chapaguri'] },
    { nome: 'Honey Butter Chip', termos: ['honey butter'] },
    { nome: 'Milkis', termos: ['milkis'] },
    { nome: 'Kancho', termos: ['kancho'] },
    { nome: 'Turtle Chips', termos: ['turtle chips'] },
    { nome: 'Snack de camarão', termos: ['saewookkang', 'camarao'] },
    { nome: 'Makgeolli', termos: ['makgeolli'] },
]

function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Um produto por ícone, na ordem da lista curada; produto repetido em dois ícones só conta uma vez. */
export function produtosIcones(produtos: StoreProduct[], limite = 8, contexto?: string): StoreProduct[] {
    const vendaveis = ordenarPrateleira(produtos.filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price), contexto)
    const titulos = new Map(vendaveis.map(p => [p.id, normalizar(stripHtml(p.title.rendered))]))
    const usados = new Set<number>()
    const saida: StoreProduct[] = []
    for (const icone of ICONES_DA_LOJA) {
        const termos = icone.termos.map(normalizar)
        const achado = vendaveis.find(p => !usados.has(p.id) && termos.some(t => titulos.get(p.id)!.includes(t)))
        if (!achado) continue
        usados.add(achado.id)
        saida.push(achado)
        if (saida.length >= limite) break
    }
    return saida
}

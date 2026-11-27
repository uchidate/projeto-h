import festasData from './festas.json'

export type NotaFesta = 'lunarNewYear' | 'firstFullMoon' | 'march1' | 'dano' | 'liberation' | 'harvest' | 'hangeulDay'

export type Festa = { nome: string; hangul: string; data: string; nota: NotaFesta; guia?: string }

/** Datas em `lib/cultura/festas.json` (dado, não código). */
export const FESTAS = festasData.festas as Festa[]

/** Quantos meses de folga a lista precisa ter; abaixo disso o teste avisa que é hora de acrescentar o ano seguinte. */
export const MESES_DE_FOLGA = 6

/** Próximas festas a partir de hoje, com os dias que faltam. Lista esgotada devolve vazio (o bloco some). */
export function proximasFestas(agora = new Date(), limite = 4) {
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
    return FESTAS
        .map(f => ({ ...f, dias: Math.round((Date.parse(f.data) - hoje) / 86_400_000) }))
        .filter(f => f.dias >= 0)
        .slice(0, limite)
}

/** Data da última festa cadastrada (UTC). */
export function ultimaFesta(festas: Festa[] = FESTAS): Date {
    return new Date(Math.max(...festas.map(f => Date.parse(f.data))))
}

/** Meses inteiros entre `agora` e a última festa cadastrada (negativo se já passou). */
export function mesesRestantes(agora = new Date(), festas: Festa[] = FESTAS): number {
    const fim = ultimaFesta(festas)
    return (fim.getUTCFullYear() - agora.getFullYear()) * 12 + (fim.getUTCMonth() - agora.getMonth()) - (fim.getUTCDate() < agora.getDate() ? 1 : 0)
}

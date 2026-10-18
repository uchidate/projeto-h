import type { WPPost } from '@/lib/wordpress/types'

/**
 * Idade máxima de uma matéria na capa da home. Capa é a promessa de "o que está acontecendo
 * agora": com 18 dias (30/09 visto em 18/10) ela passa a impressão de site parado. Depois do
 * limite a home mostra uma produção, que não envelhece, até voltar a ter matéria nova.
 */
export const DIAS_CAPA_FRESCA = 14

const DIA_MS = 86_400_000

export function idadeEmDias(dataIso: string, agora: Date = new Date()): number {
    const t = new Date(dataIso).getTime()
    if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY
    return Math.max(0, (agora.getTime() - t) / DIA_MS)
}

/**
 * Capa da home: a matéria fixada na configuração, se ainda estiver fresca; senão a mais
 * recente que esteja. `undefined` quando nenhuma está (a home cai para a produção em destaque).
 * Fixar uma capa e esquecer dela não deixa mais a home congelada.
 */
export function escolherCapa(posts: WPPost[], capaFixadaId: number | undefined, agora: Date = new Date()): WPPost | undefined {
    const frescos = posts.filter(p => idadeEmDias(p.date, agora) <= DIAS_CAPA_FRESCA)
    const fixada = frescos.find(p => p.id === capaFixadaId)
    if (fixada) return fixada
    return [...frescos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}

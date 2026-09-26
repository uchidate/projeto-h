import type { Fandom } from '@/lib/wordpress/fandoms'

interface Perfil { agencia: number | null; tipo: string | null; ano: number | null; popularidade: number }

/** O grupo mais conhecido da torcida resume o perfil dela (agência, tipo, ano de estreia, popularidade). */
const pop = (g: { acf?: unknown }) => Number((g.acf as Record<string, unknown> | undefined)?.popularity_score) || 0

function perfil(f: Fandom): Perfil {
    const g = [...f.groups].sort((a, b) => pop(b) - pop(a))[0]
    const acf = (g?.acf ?? {}) as Record<string, unknown>
    const ano = typeof acf.debut_date === 'string' ? parseInt(acf.debut_date.slice(0, 4), 10) : NaN
    return {
        agencia: typeof acf.agency === 'number' ? acf.agency : null,
        tipo: typeof acf.type === 'string' ? acf.type : null,
        ano: Number.isFinite(ano) ? ano : null,
        popularidade: Number(acf.popularity_score) || 0,
    }
}

/** Pontos de parecença entre duas torcidas: mesma agência pesa mais, depois mesmo tipo de grupo e estreia próxima. */
export function afinidade(a: Perfil, b: Perfil): number {
    let p = 0
    if (a.agencia !== null && a.agencia === b.agencia) p += 5
    if (a.tipo !== null && a.tipo === b.tipo) p += 3
    if (a.ano !== null && b.ano !== null) {
        const d = Math.abs(a.ano - b.ano)
        p += d <= 2 ? 2 : d <= 4 ? 1 : 0
    }
    return p
}

/** As torcidas mais parecidas com a dada; empate decidido pela popularidade do grupo, depois pelo nome (estável). */
export function torcidasParecidas(alvo: Fandom, todas: Fandom[], n = 8): Fandom[] {
    const base = perfil(alvo)
    return todas
        .filter(f => f.slug !== alvo.slug)
        .map(f => { const p = perfil(f); return { f, pontos: afinidade(base, p), pop: p.popularidade } })
        .sort((x, y) => y.pontos - x.pontos || y.pop - x.pop || x.f.name.localeCompare(y.f.name))
        .slice(0, n)
        .map(x => x.f)
}

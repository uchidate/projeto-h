import type { WPPost } from '@/lib/wordpress/types'

/** Dias sem publicação nova a partir dos quais o destaque deixa de ser "o mais novo" e passa a girar. */
export const JANELA_NOVIDADE_DIAS = 7
/** Idade mínima para o conteúdo contar como perene: o mesmo corte de 45 dias da pauta perene da operação. */
export const IDADE_PERENE_DIAS = 45
/** Quantos candidatos entram no rodízio do destaque. */
const CANDIDATOS_NO_RODIZIO = 5

const DIA_MS = 86_400_000

const views = (p: WPPost) => Number(p.acf?.views ?? 0) || 0
const idadeEmDias = (p: WPPost, agora: Date) => Math.max(0, (agora.getTime() - new Date(p.date).getTime()) / DIA_MS)

/** Dia corrido em São Paulo (o servidor roda em UTC e viraria o dia três horas antes). */
export function diaCorrido(agora: Date): number {
    const [a, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora).split('-').map(Number)
    return Math.floor(Date.UTC(a, m - 1, d) / DIA_MS)
}

/** Idade (dias) até a qual um artigo ganha um crédito de novidade: leitura ainda não acumulou, o interesse já pode existir. */
const NOVIDADE_DIAS = 3

/**
 * Pontuação de interesse de um artigo, sem tratar "mais novo" como "mais interessante".
 *
 * A base é a leitura humana dos últimos 90 dias (`views`), com um favorecimento leve e decrescente
 * ao que é recente. Artigo com até 3 dias ainda não teve tempo de acumular leitura: recebe um
 * crédito equivalente à mediana dos 20 mais lidos, e assim pode competir sem ganhar de graça.
 */
export function pontuar(p: WPPost, pool: WPPost[], agora: Date = new Date()): number {
    const idade = idadeEmDias(p, agora)
    const base = views(p) * (1 + 1 / (1 + idade / 30))
    if (idade > NOVIDADE_DIAS) return base
    const topo = pool.map(views).sort((a, b) => b - a).slice(0, 20)
    const mediana = topo.length ? topo[Math.floor(topo.length / 2)] : 0
    return Math.max(base, mediana)
}

/**
 * Candidatos a destaque, do mais ao menos interessante em geral. O primeiro é o destaque padrão da
 * página; o navegador escolhe entre os três primeiros com o histórico do leitor (ver BlogDestaque).
 * A ordem é a mesma para todos no dia (cache ISR), com um desempate diário para o topo não ficar parado.
 */
export function candidatosDestaque(pool: WPPost[], agora: Date = new Date(), quantidade = 3): WPPost[] {
    if (pool.length === 0) return []
    const nota = new Map(pool.map(p => [p.id, pontuar(p, pool, agora)]))
    const ranking = [...pool].sort((a, b) => nota.get(b.id)! - nota.get(a.id)! || new Date(b.date).getTime() - new Date(a.date).getTime())
    // Só gira entre quem está perto do líder (>= 60% da nota dele): um vencedor claro não sai do topo.
    const melhor = nota.get(ranking[0].id)!
    const pares = ranking.filter(p => nota.get(p.id)! >= 0.6 * melhor).slice(0, CANDIDATOS_NO_RODIZIO)
    const giro = diaCorrido(agora) % pares.length
    const rodizio = [...pares.slice(giro), ...pares.slice(0, giro)]
    return [...rodizio, ...ranking.filter(p => !rodizio.includes(p))].slice(0, quantidade)
}

/** Destaque padrão (o primeiro candidato). */
export function escolherDestaque(pool: WPPost[], agora: Date = new Date()): WPPost | null {
    return candidatosDestaque(pool, agora, 1)[0] ?? null
}

/** Escolha no navegador: entre os candidatos, pula o já lido e favorece as categorias que o leitor mais lê. */
export function escolherParaLeitor(
    candidatos: { slug: string; categoria: string | null }[],
    lidos: { slug: string; categoria?: string | null }[],
): number {
    if (candidatos.length === 0) return 0
    const jaLidos = new Set(lidos.map(l => l.slug))
    const porCategoria = new Map<string, number>()
    for (const l of lidos) if (l.categoria) porCategoria.set(l.categoria, (porCategoria.get(l.categoria) ?? 0) + 1)
    const total = lidos.filter(l => l.categoria).length
    let melhor = -1
    let melhorNota = -Infinity
    candidatos.forEach((c, i) => {
        if (jaLidos.has(c.slug)) return
        const afinidade = total > 0 && c.categoria ? (porCategoria.get(c.categoria) ?? 0) / total : 0
        const nota = (candidatos.length - i) + 2 * afinidade
        if (nota > melhorNota) { melhorNota = nota; melhor = i }
    })
    return melhor === -1 ? 0 : melhor
}

/** Mais lidos: leitura humana dos últimos 90 dias (campo `views`), do maior para o menor; empate pelo mais novo. */
export function maisLidos(pool: WPPost[]): WPPost[] {
    return [...pool]
        .filter(p => views(p) > 0)
        .sort((a, b) => views(b) - views(a) || new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Conteúdo-chave: passa dos 45 dias, não é notícia e continua entre os mais lidos, ou seja, não envelheceu. */
export function perenes(pool: WPPost[], quantidade = 6, agora: Date = new Date(), excluirCategorias: number[] = []): WPPost[] {
    // Notícia datada não é perene, mesmo quando ainda recebe leitura: fica fora quando a categoria de notícias é informada.
    const noticia = (p: WPPost) => (p.categories ?? []).some(c => excluirCategorias.includes(c))
    return maisLidos(pool).filter(p => idadeEmDias(p, agora) > IDADE_PERENE_DIAS && !noticia(p)).slice(0, quantidade)
}

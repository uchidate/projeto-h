import type { SearchResult, SearchResultType } from '@/lib/search/types'
import { stripHtml } from '@/lib/utils'
import { buildParams, wpFetchWithTotal } from '@/lib/wordpress/client'
import { WP_CACHE_TAGS } from '@/lib/wordpress/cache'
import { foldAccents, levenshtein, scoreTitle, stripSeparators } from '@/lib/search/scoring'

/**
 * Indice de busca em memoria: todos os titulos do acervo (~8 mil fichas, ~1 MB)
 * carregados do WordPress uma vez e consultados localmente — ms em vez de ~1 s.
 *
 * Nunca bloqueia nem quebra a busca: sem indice pronto (primeira requisicao
 * depois de subir, WP fora do ar) `searchIndex` devolve null e quem chamou usa a
 * busca REST. O indice se renova sozinho (stale-while-revalidate).
 */

const TTL_MS = 10 * 60 * 1000
const PER_PAGE = 100
const CONCURRENCY = 4

type Colecao = { type: SearchResultType; endpoint: string; prefix: string; tag: string; weight: number; fuzzy: boolean }

const COLECOES: Colecao[] = [
    { type: 'production', endpoint: 'production', prefix: '/productions', tag: WP_CACHE_TAGS.productions, weight: 1,   fuzzy: true },
    { type: 'artist',     endpoint: 'artist',      prefix: '/artists',     tag: WP_CACHE_TAGS.artists,     weight: 1.2, fuzzy: true },
    { type: 'group',      endpoint: 'group',       prefix: '/groups',      tag: WP_CACHE_TAGS.groups,      weight: 1.2, fuzzy: true },
    { type: 'post',       endpoint: 'posts',       prefix: '/blog',        tag: WP_CACHE_TAGS.posts,       weight: 0.6, fuzzy: false },
    { type: 'company',    endpoint: 'company',     prefix: '/empresas',    tag: WP_CACHE_TAGS.companies,   weight: 0.8, fuzzy: false },
    { type: 'food',       endpoint: 'food',        prefix: '/comidas',     tag: WP_CACHE_TAGS.foods,       weight: 0.8, fuzzy: false },
]

type WPItem = {
    id: number
    slug: string
    title: { rendered: string }
    featured_image_url?: string | null
    /** Os campos editoriais vivem em `acf`; `meta` so traz Rank Math. */
    acf?: {
        groups?: number[]
        trending_score?: number | null
        popularity_score?: number | null
        roles?: string[]
        birth_date?: string | null
        name_hangul?: string | null
        name_romanized?: string | null
        original_title?: string | null
        type?: string | null
        year?: number | null
    } | []
}

type Entrada = {
    id: number
    title: string
    /** Outras grafias buscaveis: slug, nome romanizado, hangul / titulo original. */
    alternativas: string[]
    /** Complemento exibido sob o titulo, para diferenciar homonimos ("Ator · 1972"). */
    detalhe?: string
    href: string
    type: SearchResultType
    thumbnail?: string
    weight: number
    fuzzy: boolean
    trending: number
    grupos: number[]
    palavras: string[]
    justo: string
}

let entradas: Entrada[] | null = null
let carregadoEm = 0
let carregando: Promise<void> | null = null

const PAPEL: Record<string, string> = {
    actor: 'Ator/Atriz', singer: 'Cantor(a)', idol: 'Idol', model: 'Modelo', dancer: 'Dançarino(a)',
    rapper: 'Rapper', director: 'Diretor(a)', writer: 'Roteirista', host: 'Apresentador(a)',
}

function anoDe(valor?: string | number | null): string | undefined {
    const m = String(valor ?? '').match(/^(\d{4})/)
    return m ? m[1] : undefined
}

/** Texto que diferencia fichas de mesmo nome: papel + ano de nascimento; tipo + ano da obra. */
function detalheDe(type: SearchResultType, acf?: Exclude<WPItem['acf'], unknown[] | undefined>): string | undefined {
    if (!acf) return undefined
    if (type === 'artist') {
        const papel = PAPEL[acf.roles?.[0] ?? '']
        return [papel, anoDe(acf.birth_date)].filter(Boolean).join(' · ') || undefined
    }
    if (type === 'production') {
        const tipo = acf.type === 'movie' ? 'Filme' : acf.type === 'drama' ? 'Série' : undefined
        return [tipo, anoDe(acf.year)].filter(Boolean).join(' · ') || undefined
    }
    return undefined
}

async function buscarColecao(c: Colecao): Promise<Entrada[]> {
    const pagina = (page: number) => wpFetchWithTotal<WPItem>(
        `/wp/v2/${c.endpoint}${buildParams({
            page,
            per_page: PER_PAGE,
            status: 'publish',
            _fields: 'id,slug,title,featured_image_url,acf.groups,acf.trending_score,acf.popularity_score,acf.roles,acf.birth_date,acf.name_hangul,acf.name_romanized,acf.original_title,acf.type,acf.year',
        })}`,
        { revalidate: 300, tags: [c.tag] },
    )
    const primeira = await pagina(1)
    if (primeira.items.length === 0) return []
    const itens = [...primeira.items]
    for (let p = 2; p <= primeira.totalPages; p += CONCURRENCY) {
        const paginas = Array.from({ length: Math.min(CONCURRENCY, primeira.totalPages - p + 1) }, (_, i) => p + i)
        const lote = await Promise.all(paginas.map(pagina))
        lote.forEach(r => itens.push(...r.items))
    }
    return itens.map(item => {
        const titulo = stripHtml(item.title.rendered)
        const acf = Array.isArray(item.acf) || !item.acf ? undefined : item.acf
        return {
            id: item.id,
            title: titulo,
            alternativas: [item.slug.replace(/-/g, ' '), acf?.name_romanized, acf?.name_hangul, acf?.original_title]
                .filter((x): x is string => !!x && x !== titulo),
            detalhe: detalheDe(c.type, acf),
            href: `${c.prefix}/${item.slug}`,
            type: c.type,
            thumbnail: item.featured_image_url ?? undefined,
            weight: c.weight,
            fuzzy: c.fuzzy,
            trending: Math.max(acf?.trending_score ?? 0, acf?.popularity_score ?? 0),
            grupos: acf?.groups ?? [],
            palavras: foldAccents(titulo).split(/[\s\-]+/).filter(Boolean),
            justo: stripSeparators(titulo),
        }
    })
}

async function carregar(): Promise<void> {
    const partes = await Promise.all(COLECOES.map(buscarColecao))
    // Colecao vazia = WP falhou (ou build): nao substitui um indice bom por um pela metade.
    if (partes.some(p => p.length === 0)) throw new Error('indice de busca incompleto')
    entradas = partes.flat()
    carregadoEm = Date.now()
}

function garantirCarregando(): void {
    if (carregando) return
    carregando = carregar()
        .catch(e => { console.error('Indice de busca: falha ao carregar', e) })
        .finally(() => { carregando = null })
}

/** Para testes. */
export function __reiniciarIndice(): void {
    entradas = null
    carregadoEm = 0
    carregando = null
}

/** Espera a carga em andamento (uso: testes e aquecimento). */
export async function aguardarIndice(): Promise<void> {
    garantirCarregando()
    await carregando
}

export async function searchIndex(query: string, limit: number): Promise<SearchResult[] | null> {
    if (!entradas || Date.now() - carregadoEm > TTL_MS) garantirCarregando()
    if (!entradas) return null // primeira vez: quem chamou usa a busca REST

    const q = query.trim()
    const base = entradas
    const ranqueado: Array<{ e: Entrada; score: number }> = []
    for (const e of base) {
        // Melhor entre titulo e grafias alternativas (slug, romanizado, hangul).
        const s = Math.max(scoreTitle(e.title, q), ...e.alternativas.map(a => scoreTitle(a, q)))
        if (s > 0) ranqueado.push({ e, score: s * e.weight + Math.min(e.trending, 100) * 0.05 })
    }

    // Erro de digitacao: so quando quase nada casou direto. Toda a base, mas com
    // pre-filtro por tamanho para nao pagar Levenshtein em 8 mil titulos.
    if (ranqueado.length < 3 && q.length >= 3) {
        const alvo = foldAccents(q)
        const limiar = Math.max(1, Math.ceil(alvo.length * 0.34))
        for (const e of base) {
            if (!e.fuzzy) continue
            let melhor = Infinity
            for (const c of [e.justo, ...e.palavras]) {
                if (Math.abs(c.length - alvo.length) > limiar) continue
                melhor = Math.min(melhor, levenshtein(c, alvo))
            }
            if (melhor <= limiar) ranqueado.push({ e, score: (30 - melhor) * e.weight + Math.min(e.trending, 100) * 0.05 })
        }
    }

    ranqueado.sort((a, b) => b.score - a.score)
    const nomeGrupo = new Map(base.filter(e => e.type === 'group').map(g => [g.id, g.title]))
    return ranqueado.slice(0, limit).map(({ e }) => {
        const r: SearchResult = { id: e.id, title: e.title, href: e.href, type: e.type, thumbnail: e.thumbnail }
        if (e.type === 'artist') {
            const nomes = e.grupos.map(id => nomeGrupo.get(id)).filter(Boolean)
            const ano = e.detalhe?.match(/\d{4}$/)?.[0]
            if (nomes.length) r.subtitle = [`Membro de ${nomes.slice(0, 2).join(', ')}`, ano].filter(Boolean).join(' · ')
            else if (e.detalhe) r.subtitle = e.detalhe
        } else if (e.detalhe) {
            r.subtitle = e.detalhe
        }
        return r
    })
}

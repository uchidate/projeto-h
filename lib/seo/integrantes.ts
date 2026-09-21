/**
 * Integrantes de um grupo em formato tabular, para a tabela "idade e posição".
 *
 * 61% das impressões das páginas de grupo são buscas por membros ("seventeen
 * membros", "integrantes do X") e 1-3% por idade. Uma tabela semântica dá ao
 * Google a estrutura que o cartão visual não dá, e um resumo em texto corrido
 * ("X tem 13 integrantes: A, B, C") é o formato que ele extrai como resposta.
 *
 * Só dado que a ficha já tem (nome, hangul, nascimento, posições). Sem dado,
 * o campo fica nulo e a tabela mostra um traço: nada é inferido.
 */
import { getAge, parseAcfDate, stripHtml } from '@/lib/utils'
import { POSITION_LABELS } from '@/lib/constants/positions'
import type { MemberSummary } from '@/lib/artists/memberSummary'

export interface LinhaIntegrante {
    slug: string
    nome: string
    hangul: string | null
    /** ISO `AAAA-MM-DD`, ou nulo se a ficha não tem data válida. */
    nascimento: string | null
    idade: number | null
    posicoes: string[]
}

function isoValido(data?: string): string | null {
    if (!data) return null
    const d = parseAcfDate(data)
    if (Number.isNaN(d.getTime())) return null
    const dois = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`
}

export function linhasIntegrantes(
    membros: MemberSummary[],
    posicoes: Record<string, string[] | undefined> = {},
    hoje: Date = new Date(),
): LinhaIntegrante[] {
    return membros.map(m => {
        const nascimento = isoValido(m.acf?.birth_date)
        // Falecido: a idade "hoje" não existe, então não se mostra.
        const idade = m.acf?.death_date ? null : getAge(nascimento ?? undefined, hoje)
        return {
            slug: m.slug,
            nome: stripHtml(m.title.rendered),
            hangul: m.acf?.name_hangul?.trim() || null,
            nascimento,
            idade,
            posicoes: (posicoes[m.slug] ?? []).map(p => POSITION_LABELS[p] ?? p),
        }
    })
}

/** "A, B e C" — o formato do resumo em texto corrido. */
export function listaDeNomes(nomes: string[], conector = 'e'): string {
    if (nomes.length <= 1) return nomes.join('')
    return `${nomes.slice(0, -1).join(', ')} ${conector} ${nomes[nomes.length - 1]}`
}

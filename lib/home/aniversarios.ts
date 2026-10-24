import type { WPArtist } from '@/lib/wordpress/types'
import { parseAcfDate, stripHtml } from '@/lib/utils'

export interface AniversarianteHome {
    nome: string
    slug: string
    hangul: string | null
    foto: string | null
    /** Idade que completa no dia. */
    idade: number
}

export interface DiaDeAniversarios {
    /** AAAA-MM-DD */
    data: string
    nomes: AniversarianteHome[]
}

export interface AniversariosHome {
    hoje: AniversarianteHome[]
    seguintes: DiaDeAniversarios[]
    /** Hoje + os próximos dias, AAAA-MM-DD, para a faixa da semana. */
    semana: string[]
}

const DIA_MS = 86_400_000

/** Hoje no fuso de Brasília, como AAAA-MM-DD (o servidor roda em UTC). */
export function hojeEmBrasilia(agora = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

function chave(mes: number, dia: number) {
    return `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Aniversários de hoje e dos próximos dias. Ordena por popularidade,
 * ignora falecidos e limita quantos nomes aparecem por dia. Dias sem aniversariante não aparecem.
 */
export function montarAniversarios(
    artistas: WPArtist[],
    hoje: string,
    { dias = 6, nomesPorDia = 3, nomesHoje = 5 } = {},
): AniversariosHome {
    const [ano, mes, dia] = hoje.split('-').map(Number)
    const base = Date.UTC(ano, mes - 1, dia)
    const porChave = new Map<string, AniversarianteHome[]>()
    const vistos = new Set<number>()

    // A API não ordena por popularidade junto com o filtro de mês (devolve vazio): ordena aqui.
    const porPopularidade = [...artistas].sort((a, b) => (b.acf?.popularity_score ?? 0) - (a.acf?.popularity_score ?? 0))
    for (const artista of porPopularidade) {
        const nascimento = artista.acf?.birth_date
        if (!nascimento || artista.acf?.death_date || vistos.has(artista.id)) continue
        vistos.add(artista.id)
        const d = parseAcfDate(nascimento)
        if (Number.isNaN(d.getTime())) continue
        const k = chave(d.getMonth() + 1, d.getDate())
        const lista = porChave.get(k) ?? []
        const mes = d.getMonth() + 1
        const completa = mes < Number(hoje.slice(5, 7)) || (mes === Number(hoje.slice(5, 7)) && d.getDate() < Number(hoje.slice(8, 10))) ? ano + 1 : ano
        lista.push({
            nome: stripHtml(artista.title.rendered),
            slug: artista.slug,
            hangul: artista.acf?.name_hangul ?? null,
            foto: artista.featured_image_url ?? null,
            idade: completa - d.getFullYear(),
        })
        porChave.set(k, lista)
    }

    const doDia = (offset: number) => {
        const d = new Date(base + offset * DIA_MS)
        return { data: d.toISOString().slice(0, 10), nomes: porChave.get(chave(d.getUTCMonth() + 1, d.getUTCDate())) ?? [] }
    }

    const semana = Array.from({ length: dias + 1 }, (_, i) => doDia(i).data)

    const seguintes: DiaDeAniversarios[] = []
    for (let i = 1; i <= dias; i++) {
        const { data, nomes } = doDia(i)
        if (nomes.length) seguintes.push({ data, nomes: nomes.slice(0, nomesPorDia) })
    }
    return { hoje: doDia(0).nomes.slice(0, nomesHoje), seguintes, semana }
}

/** Meses a buscar para cobrir hoje + `dias` à frente (vira o mês perto do fim). */
export function mesesParaBuscar(hoje: string, dias = 6): number[] {
    const [ano, mes, dia] = hoje.split('-').map(Number)
    const fim = new Date(Date.UTC(ano, mes - 1, dia) + dias * DIA_MS)
    const mesFim = fim.getUTCMonth() + 1
    return mesFim === mes ? [mes] : [mes, mesFim]
}

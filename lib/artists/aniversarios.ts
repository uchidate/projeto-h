import { getWPImage, parseAcfDate, stripHtml } from '@/lib/utils'
import type { WPArtist } from '@/lib/wordpress/types'

export interface AniversarianteSemana {
    slug: string
    nome: string
    foto: string | null
    quando: string
    idade: number | null
}

export interface Hoje { ano: number; mes: number; dia: number }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Data de hoje no fuso de São Paulo: o servidor roda em UTC e viraria o dia três horas antes. */
export function hojeEmSaoPaulo(agora: Date = new Date()): Hoje {
    const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora).split('-').map(Number)
    return { ano, mes, dia }
}

/** Meses que a janela toca: o de hoje e, quando a semana vira o mês, o seguinte. */
export function mesesDaJanela(hoje: Hoje, dias = 7): number[] {
    const fim = new Date(Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia + dias - 1))
    const meses = [hoje.mes, fim.getUTCMonth() + 1]
    return meses.filter((m, i) => meses.indexOf(m) === i)
}

/** Quem faz aniversário nos próximos `dias` dias (hoje incluso), do mais próximo ao mais distante. */
export function aniversariosDaSemana(artistas: WPArtist[], hoje: Hoje, dias = 7, max = 5): AniversarianteSemana[] {
    const base = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia)
    const achados = artistas.flatMap(a => {
        // Artista falecido não entra na agenda de aniversários.
        if (!a.acf?.birth_date || a.acf?.death_date) return []
        let nascimento: Date
        try { nascimento = parseAcfDate(a.acf.birth_date) } catch { return [] }
        const mes = nascimento.getUTCMonth()
        const dia = nascimento.getUTCDate()
        let proximo = Date.UTC(hoje.ano, mes, dia)
        if (proximo < base) proximo = Date.UTC(hoje.ano + 1, mes, dia)
        const falta = Math.round((proximo - base) / 86_400_000)
        if (falta >= dias) return []
        const anoNasc = nascimento.getUTCFullYear()
        const idade = anoNasc > 1900 ? new Date(proximo).getUTCFullYear() - anoNasc : null
        const quandoData = falta === 0 ? 'Hoje' : `${dia} ${MESES[mes]}`
        return [{
            falta,
            item: {
                slug: a.slug,
                nome: stripHtml(a.title?.rendered ?? ''),
                foto: getWPImage(a._embedded, a.featured_image_url)?.src ?? null,
                quando: idade != null ? `${quandoData} · ${idade} anos` : quandoData,
                idade,
            } satisfies AniversarianteSemana,
        }]
    })
    return achados
        .sort((x, y) => x.falta - y.falta || x.item.nome.localeCompare(y.item.nome))
        .slice(0, max)
        .map(x => x.item)
}

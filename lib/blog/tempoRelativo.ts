import { formatDatePt } from '@/lib/utils'

const MIN = 60_000
const HORA = 60 * MIN

/**
 * A REST do WordPress devolve `date` no horário do site (São Paulo, UTC-3 o ano todo desde 2019),
 * sem indicar o fuso. Lida como veio, o servidor (UTC) erraria 3 horas.
 */
export function instanteDoPost(date: string): Date {
    return new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(date) ? date : `${date}-03:00`)
}

/**
 * Idade de uma notícia para a lista: "há 40 min", "há 5 h", "ontem" e, a partir de 48 h, a data.
 * Só serve para o que acabou de sair; o recorte de 48 h evita "há 30 h" soar como atraso.
 */
export function tempoRelativoPt(date: string, agora: Date = new Date()): string {
    const idade = agora.getTime() - instanteDoPost(date).getTime()
    if (!Number.isFinite(idade) || idade < 0) return formatDatePt(date)
    if (idade < MIN) return 'agora'
    if (idade < HORA) return `há ${Math.floor(idade / MIN)} min`
    if (idade < 24 * HORA) return `há ${Math.floor(idade / HORA)} h`
    if (idade < 48 * HORA) return 'ontem'
    return formatDatePt(date)
}

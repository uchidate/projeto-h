import type { Locale } from '@/lib/i18n/config'

const DIA_MS = 86_400_000
/** `Record<Locale, …>`: idioma novo sem estas palavras não compila. */
const PALAVRAS: Record<Locale, { hoje: string; ontem: string }> = {
    pt: { hoje: 'hoje', ontem: 'ontem' },
    en: { hoje: 'today', ontem: 'yesterday' },
    es: { hoje: 'hoy', ontem: 'ayer' },
    ja: { hoje: '今日', ontem: '昨日' },
}

/** Dia civil (AAAA-MM-DD) de um instante, no fuso de Brasília. */
function diaEmBrasilia(d: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
}

/** "hoje", "ontem" ou "20/10" (em inglês, "Oct 20"): a data curta que a vitrine usa nas listas. */
export function dataRelativa(iso: string, locale: Locale, agora = new Date()): string {
    const publicado = new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
    const dia = diaEmBrasilia(publicado)
    const palavras = PALAVRAS[locale]
    if (dia === diaEmBrasilia(agora)) return palavras.hoje
    if (dia === diaEmBrasilia(new Date(agora.getTime() - DIA_MS))) return palavras.ontem
    // Dia/mês com barra só faz sentido em português; em inglês "05/07" lê-se 5 de maio.
    if (locale !== 'pt') return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }).format(publicado)
    const [, mes, d] = dia.split('-')
    return `${d}/${mes}`
}

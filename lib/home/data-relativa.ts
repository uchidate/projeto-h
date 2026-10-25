import type { Locale } from '@/lib/i18n/config'

const DIA_MS = 86_400_000
const PALAVRAS = { pt: { hoje: 'hoje', ontem: 'ontem' }, en: { hoje: 'today', ontem: 'yesterday' } } as const

/** Dia civil (AAAA-MM-DD) de um instante, no fuso de Brasília. */
function diaEmBrasilia(d: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
}

/** "hoje", "ontem" ou "20/10": a data curta que a vitrine usa nas listas. */
export function dataRelativa(iso: string, locale: Locale, agora = new Date()): string {
    const publicado = new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
    const dia = diaEmBrasilia(publicado)
    const palavras = PALAVRAS[locale === 'en' ? 'en' : 'pt']
    if (dia === diaEmBrasilia(agora)) return palavras.hoje
    if (dia === diaEmBrasilia(new Date(agora.getTime() - DIA_MS))) return palavras.ontem
    const [, mes, d] = dia.split('-')
    return `${d}/${mes}`
}

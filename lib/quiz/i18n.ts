import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

/**
 * Perguntas do quiz em outro idioma. O texto é a tradução publicada no WordPress (`_oc_i18n` da pergunta, que chega
 * em `QuizQuestion.traducoes`). As alternativas mantêm a ordem do original, então `correct` continua valendo.
 * Pergunta sem tradução, com a tradução desatualizada (`stale`) ou incompleta não existe no idioma.
 */
const texto = (v: unknown): string => (typeof v === 'string' ? v.replace(/\\+"/g, '"').trim() : '')

function traducaoDe(p: QuizQuestion, locale: Locale): { q: string; o: string[]; e: string } | undefined {
    const wp = p.traducoes?.[locale]
    if (!wp || wp.stale) return undefined
    const a = wp.acf ?? {}
    const tr = { q: texto(a.question), o: [a.option_a, a.option_b, a.option_c, a.option_d].map(texto), e: texto(a.explanation) }
    return tr.q && tr.o.every(Boolean) ? tr : undefined
}

/** Só as perguntas com tradução, já com texto no idioma. Em português devolve a lista como veio. Sem link para artigo (são em português). */
export function perguntasNoIdioma(perguntas: QuizQuestion[], locale: Locale): QuizQuestion[] {
    if (locale === SOURCE_LOCALE) return perguntas
    return perguntas.flatMap((p) => {
        const tr = traducaoDe(p, locale)
        return tr ? [{ ...p, question: tr.q, options: [...tr.o], explanation: tr.e, relatedHref: null, relatedLabel: null, traducoes: undefined }] : []
    })
}

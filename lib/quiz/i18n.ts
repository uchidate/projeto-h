import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import en from './traducoes/en.json'
import ja from './traducoes/ja.json'
import es from './traducoes/es.json'

/**
 * Perguntas do quiz traduzidas. A fonte é a tradução publicada no WordPress (`_oc_i18n` da pergunta, em
 * `QuizQuestion.traducoes`); `traducoes/<idioma>.json`, indexado pelo id da pergunta, é a reserva enquanto a
 * pergunta não tem tradução lá. As alternativas mantêm a ordem do original, então `correct` continua valendo.
 * Pergunta sem tradução, ou com a do WordPress desatualizada (`stale`), não existe no idioma.
 */
export type TraducaoDaPergunta = { q: string; o: string[]; e: string }

const TRADUCOES: Partial<Record<Locale, Record<string, TraducaoDaPergunta>>> = {
    en: en as Record<string, TraducaoDaPergunta>,
    ja: ja as Record<string, TraducaoDaPergunta>,
    es: es as Record<string, TraducaoDaPergunta>,
}

export function traducoesDasPerguntas(locale: Locale): Record<string, TraducaoDaPergunta> {
    return locale === SOURCE_LOCALE ? {} : TRADUCOES[locale] ?? {}
}

const texto = (v: unknown): string => (typeof v === 'string' ? v.replace(/\\+"/g, '"').trim() : '')

/** Tradução da pergunta no idioma: a do WordPress se houver (desatualizada = nenhuma), senão a do JSON. */
function traducaoDe(p: QuizQuestion, locale: Locale, json: Record<string, TraducaoDaPergunta>): TraducaoDaPergunta | undefined {
    const wp = p.traducoes?.[locale]
    if (!wp) return json[String(p.id)]
    if (wp.stale) return undefined
    const a = wp.acf ?? {}
    const tr = { q: texto(a.question), o: [a.option_a, a.option_b, a.option_c, a.option_d].map(texto), e: texto(a.explanation) }
    return tr.q && tr.o.every(Boolean) ? tr : undefined
}

/** Só as perguntas com tradução, já com texto no idioma. Em português devolve a lista como veio. Sem link para artigo (são em português). */
export function perguntasNoIdioma(perguntas: QuizQuestion[], locale: Locale): QuizQuestion[] {
    if (locale === SOURCE_LOCALE) return perguntas
    const json = traducoesDasPerguntas(locale)
    return perguntas.flatMap((p) => {
        const tr = traducaoDe(p, locale, json)
        return tr ? [{ ...p, question: tr.q, options: [...tr.o], explanation: tr.e, relatedHref: null, relatedLabel: null, traducoes: undefined }] : []
    })
}

import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import en from './traducoes/en.json'

/**
 * Perguntas do quiz traduzidas. O texto vive em `traducoes/<idioma>.json`, indexado pelo id da pergunta no WordPress;
 * as alternativas mantêm a ordem do original, então `correct` continua valendo. Pergunta sem entrada não existe no idioma.
 */
export type TraducaoDaPergunta = { q: string; o: string[]; e: string }

const TRADUCOES: Partial<Record<Locale, Record<string, TraducaoDaPergunta>>> = { en: en as Record<string, TraducaoDaPergunta> }

export function traducoesDasPerguntas(locale: Locale): Record<string, TraducaoDaPergunta> {
    return locale === SOURCE_LOCALE ? {} : TRADUCOES[locale] ?? {}
}

/** Só as perguntas com tradução, já com texto no idioma. Em português devolve a lista como veio. Sem link para artigo (são em português). */
export function perguntasNoIdioma(perguntas: QuizQuestion[], locale: Locale): QuizQuestion[] {
    if (locale === SOURCE_LOCALE) return perguntas
    const traducoes = traducoesDasPerguntas(locale)
    return perguntas.flatMap((p) => {
        const tr = traducoes[String(p.id)]
        return tr ? [{ ...p, question: tr.q, options: [...tr.o], explanation: tr.e, relatedHref: null, relatedLabel: null }] : []
    })
}

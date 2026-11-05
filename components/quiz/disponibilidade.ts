import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { perguntasNoIdioma } from '@/lib/quiz/i18n'

export const VALID_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia'] as QuizCategory[]

/** Parâmetros de `quizCategory`: o registro usa `categoria` no caminho em português e `category` no inglês. */
export const paramsDoTema = (categoria: string) => ({ categoria, category: categoria })

/** Temas do quiz que têm perguntas no idioma. Em português são todos; nos demais, só os que já têm tradução. */
export async function categoriasDoIdioma(locale: Locale): Promise<QuizCategory[]> {
    if (locale === DEFAULT_LOCALE) return VALID_CATEGORIES
    const perguntas = perguntasNoIdioma(await getQuizQuestions(), locale)
    return VALID_CATEGORIES.filter(c => perguntas.filter(q => q.category === c).length >= 5)
}

/** Idiomas em que o tema existe, para hreflang. */
export async function idiomasDoTema(categoria: QuizCategory | null, candidatos: readonly Locale[]): Promise<Locale[]> {
    const ok = await Promise.all(candidatos.map(async l => (categoria === null ? true : (await categoriasDoIdioma(l)).includes(categoria))))
    return candidatos.filter((_, i) => ok[i])
}

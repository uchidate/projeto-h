import { getQuizQuestions } from '@/lib/wordpress/quiz'
import { chaveDia, escolherDoDia } from '@/lib/quiz/dia'
import { perguntasNoIdioma } from '@/lib/quiz/i18n'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { PerguntaDoDia } from './PerguntaDoDia'

// Pergunta de opinião ("mais amado", "melhor") não tem resposta única: não serve como pergunta do dia.
const SUBJETIVA = /\b(mais (amad|famos|popular|marcante|import)|melhor|maior sucesso|favorit)/i

/**
 * Escolhe a pergunta do dia no servidor. Sem perguntas (WordPress fora), some em vez de quebrar a página.
 * Fora do português só entram as perguntas com tradução (já escolhidas à mão, sem as de opinião) e o link do
 * quiz completo some enquanto o quiz não existir no idioma.
 */
export async function PerguntaDoDiaServer({ variante = 'padrao', locale = DEFAULT_LOCALE }: { variante?: 'padrao' | 'alegre'; locale?: Locale } = {}) {
    const chave = chaveDia()
    const emPt = locale === DEFAULT_LOCALE
    const todas = perguntasNoIdioma(await getQuizQuestions(), locale)
    const pergunta = escolherDoDia(todas.filter(q => q.options.length === 4 && (!emPt || !SUBJETIVA.test(q.question))), chave)
    if (!pergunta) return null
    const dataExtenso = new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' }).format(new Date())
    const { id, question, options, correct, explanation } = pergunta
    return <PerguntaDoDia pergunta={{ id, question, options, correct, explanation }} chave={chave} dataExtenso={dataExtenso} variante={variante} quizHref={emPt ? href('quiz', undefined, locale) : null} />
}

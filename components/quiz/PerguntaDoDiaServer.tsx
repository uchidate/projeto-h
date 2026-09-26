import { getQuizQuestions } from '@/lib/wordpress/quiz'
import { chaveDia, escolherDoDia } from '@/lib/quiz/dia'
import { PerguntaDoDia } from './PerguntaDoDia'

// Pergunta de opinião ("mais amado", "melhor") não tem resposta única: não serve como pergunta do dia.
const SUBJETIVA = /\b(mais (amad|famos|popular|marcante|import)|melhor|maior sucesso|favorit)/i

/** Escolhe a pergunta do dia no servidor. Sem perguntas (WordPress fora), some em vez de quebrar a página. */
export async function PerguntaDoDiaServer({ embutida = false }: { embutida?: boolean } = {}) {
    const chave = chaveDia()
    const pergunta = escolherDoDia((await getQuizQuestions()).filter(q => q.options.length === 4 && !SUBJETIVA.test(q.question)), chave)
    if (!pergunta) return null
    const dataExtenso = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' }).format(new Date())
    const { id, question, options, correct, explanation } = pergunta
    return <PerguntaDoDia pergunta={{ id, question, options, correct, explanation }} chave={chave} dataExtenso={dataExtenso} embutida={embutida} />
}

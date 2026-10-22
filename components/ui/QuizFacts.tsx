import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Trophy, ArrowRight, Lightbulb } from 'lucide-react'
import { MiniQuiz } from './MiniQuiz'
import { getQuizQuestions } from '@/lib/wordpress/quiz'
import { quizCategoryTone } from '@/lib/quiz/categoryMeta'

const diaDoAno = () => Math.floor(Date.now() / 86400000)

interface Props {
    entitySlug: string   // ex: "iu", "bts", "my-misterious-girl"
    entityType: 'artist' | 'group' | 'production' | 'agency'
    entityName: string
    entityId?: number
    /** Só para entityType="agency": junta as perguntas de todos os grupos/artistas do roster. */
    groupIds?: number[]
    artistIds?: number[]
}

export async function QuizFacts({ entitySlug, entityType, entityName, entityId, groupIds, artistIds }: Props) {
    const t = await getTranslations('profile.ui')
    const path = entityType === 'artist' ? `/artists/${entitySlug}`
        : entityType === 'group' ? `/groups/${entitySlug}`
        : entityType === 'production' ? `/productions/${entitySlug}`
        : null

    const allQuestions = await getQuizQuestions()

    // Perguntas ligadas à entidade (por link do post ou pelos vínculos do quiz)
    const chave = entityType === 'artist' ? 'artists' : entityType === 'group' ? 'groups' : 'productions'
    // Pergunta cuja resposta é a própria entidade entrega a resposta na página dela.
    const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const nome = norm(entityName)
    const entregaResposta = (q: { options: string[]; correct: number }) => {
        const certa = norm(q.options[q.correct] ?? '')
        return certa.length >= 3 && (certa === nome || certa.includes(nome) || nome.includes(certa))
    }
    const elegiveis = allQuestions
        .filter(q => !entregaResposta(q))
        .filter(q => entityType === 'agency'
            ? (groupIds?.some(id => q.links?.groups.includes(id)) ?? false) || (artistIds?.some(id => q.links?.artists.includes(id)) ?? false)
            : q.relatedHref?.includes(path!) || (entityId != null && q.links?.[chave].includes(entityId)))

    if (elegiveis.length === 0) return null

    // Rotação determinística: mesmo resultado dentro do ciclo de cache (ISR), mas
    // muda por entidade e a cada dia — quem revisita a ficha não vê sempre as
    // mesmas 5 perguntas, sem precisar de aleatoriedade de verdade no servidor.
    const semente = (entityId ?? entitySlug.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) + diaDoAno()
    const QUANTIDADE = 5
    const facts = elegiveis.length <= QUANTIDADE
        ? elegiveis
        : Array.from({ length: QUANTIDADE }, (_, k) => elegiveis[(semente + k) % elegiveis.length])

    const categoria = facts[0]?.category
    const tone = quizCategoryTone(categoria)
    const quizHref = `/quiz/${categoria ?? 'k-pop'}`

    return (
        <section className="border-t border-border/40 page-wrap py-8">
            <div className="flex items-center gap-2 mb-4">
                <div className={`flex h-6 w-6 items-center justify-center ${tone.bg}`}>
                    <Lightbulb className={`w-3.5 h-3.5 ${tone.text}`} />
                </div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                    Teste o que você sabe · {entityName}
                </p>
            </div>

            <MiniQuiz items={facts.map(({ id, question, options, correct, explanation }) => ({ id, question, options, correct, explanation }))} entityName={entityName} quizHref={quizHref} tone={tone} />

            <Link href={quizHref}
                className={`mt-4 inline-flex items-center gap-2 text-[11px] font-black hover:underline ${tone.text}`}>
                <Trophy className="w-3.5 h-3.5" />
                {t('quiz.testKnowledge')}
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </section>
    )
}

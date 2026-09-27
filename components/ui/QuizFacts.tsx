import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Trophy, ArrowRight, Lightbulb } from 'lucide-react'
import { MiniQuiz } from './MiniQuiz'
import { getQuizQuestions } from '@/lib/wordpress/quiz'

interface Props {
    entitySlug: string   // ex: "iu", "bts", "my-misterious-girl"
    entityType: 'artist' | 'group' | 'production'
    entityName: string
    entityId?: number
}

export async function QuizFacts({ entitySlug, entityType, entityName, entityId }: Props) {
    const t = await getTranslations('profile.ui')
    const path = entityType === 'artist' ? `/artists/${entitySlug}`
        : entityType === 'group' ? `/groups/${entitySlug}`
        : `/productions/${entitySlug}`

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
    const facts = allQuestions
        .filter(q => !entregaResposta(q))
        .filter(q => q.relatedHref?.includes(path) || (entityId != null && q.links?.[chave].includes(entityId)))
        .slice(0, 5)

    if (facts.length === 0) return null

    return (
        <section className="border-t border-border/40 page-wrap py-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center bg-accent/10">
                    <Lightbulb className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                    Teste o que você sabe · {entityName}
                </p>
            </div>

            <MiniQuiz items={facts.map(({ id, question, options, correct, explanation }) => ({ id, question, options, correct, explanation }))} entityName={entityName} quizHref={`/quiz/${facts[0]?.category ?? 'k-pop'}`} />

            <Link href={`/quiz/${facts[0]?.category ?? 'k-pop'}`}
                className="mt-4 inline-flex items-center gap-2 text-[11px] font-black text-accent hover:underline">
                <Trophy className="w-3.5 h-3.5" />
                {t('quiz.testKnowledge')}
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </section>
    )
}

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Trophy, ArrowRight, Lightbulb } from 'lucide-react'
import { getQuizQuestions } from '@/lib/wordpress/quiz'

interface Props {
    entitySlug: string   // ex: "iu", "bts", "my-misterious-girl"
    entityType: 'artist' | 'group' | 'production'
    entityName: string
}

export async function QuizFacts({ entitySlug, entityType, entityName }: Props) {
    const t = await getTranslations('profile.ui')
    const path = entityType === 'artist' ? `/artists/${entitySlug}`
        : entityType === 'group' ? `/groups/${entitySlug}`
        : `/productions/${entitySlug}`

    const allQuestions = await getQuizQuestions()

    // Filtra perguntas cujo relatedHref aponta para esta entidade
    const facts = allQuestions
        .filter(q => q.relatedHref?.includes(path))
        .slice(0, 3)

    if (facts.length === 0) return null

    return (
        <section className="border-t border-border/40 page-wrap py-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center bg-accent/10">
                    <Lightbulb className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                    Você sabia? · Fatos do quiz sobre {entityName}
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(q => (
                    <div key={q.id} className="border border-border bg-surface p-4">
                        <p className="text-[12px] font-black text-foreground leading-snug mb-2">{q.options[q.correct]}</p>
                        <p className="text-[11px] text-muted leading-relaxed line-clamp-3">{q.explanation}</p>
                    </div>
                ))}
            </div>

            <Link href={`/quiz?category=${facts[0]?.category ?? 'k-pop'}`}
                className="mt-4 inline-flex items-center gap-2 text-[11px] font-black text-accent hover:underline">
                <Trophy className="w-3.5 h-3.5" />
                {t('quiz.testKnowledge')}
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </section>
    )
}

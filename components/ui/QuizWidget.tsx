import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Trophy, ArrowRight, Sparkles } from 'lucide-react'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { quizCategoryTone } from '@/lib/quiz/categoryMeta'

interface Props {
    category?: QuizCategory | 'all'
    title?: string
    description?: string
}

export function QuizWidget({ category = 'all', title, description }: Props) {
    const t = useTranslations('profile.ui')
    const meta = quizCategoryTone(category === 'all' ? undefined : category)
    const href = category !== 'all' ? `/quiz/${category}` : '/quiz'
    const defaultTitle = title ?? t('quiz.title', { topic: meta.label })
    const defaultDesc = description ?? t('quiz.desc', { topic: meta.label })

    return (
        <div className="border-t border-border/40">
            <div className="page-wrap py-8">
                <Link
                    href={href}
                    className={`group flex items-center gap-4 border border-border bg-surface transition-colors p-4 sm:p-5 ${meta.hoverBorder}`}
                >
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center border border-border ${meta.bg} ${meta.text} transition-colors ${meta.groupHoverBorder}`}>
                        <Trophy className="h-5 w-5" />
                        <div className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center ${meta.bg}`}>
                            <Sparkles className={`h-2.5 w-2.5 ${meta.text}`} />
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className={`font-mono text-[9px] font-black uppercase tracking-[0.18em] mb-0.5 ${meta.text}`}>
                            Quiz {meta.label}
                        </p>
                        <p className={`text-[15px] font-black leading-tight tracking-[-0.02em] text-foreground transition-colors ${meta.groupHoverText}`}>
                            {defaultTitle}
                        </p>
                        <p className="text-[12px] text-muted mt-0.5 line-clamp-1">{defaultDesc}</p>
                    </div>

                    <ArrowRight className={`h-5 w-5 shrink-0 text-muted transition-all group-hover:translate-x-0.5 ${meta.groupHoverText}`} />
                </Link>
            </div>
        </div>
    )
}

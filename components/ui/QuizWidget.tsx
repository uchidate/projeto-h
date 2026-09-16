import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Trophy, ArrowRight, Sparkles } from 'lucide-react'
import type { QuizCategory } from '@/lib/wordpress/quiz'

interface Props {
    category?: QuizCategory | 'all'
    title?: string
    description?: string
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
    'k-pop':    { label: 'K-Pop',   color: 'text-pink-400' },
    'k-drama':  { label: 'K-Drama', color: 'text-blue-400' },
    'cultura':  { label: 'Cultura', color: 'text-purple-400' },
    'historia': { label: 'História',color: 'text-amber-400' },
    'all':      { label: 'Hallyu',  color: 'text-accent' },
}

export function QuizWidget({ category = 'all', title, description }: Props) {
    const t = useTranslations('profile.ui')
    const meta = CATEGORY_META[category] ?? CATEGORY_META.all
    const href = category !== 'all' ? `/quiz?category=${category}` : '/quiz'
    const defaultTitle = title ?? t('quiz.title', { topic: meta.label })
    const defaultDesc = description ?? t('quiz.desc', { topic: meta.label })

    return (
        <div className="border-t border-border/40">
            <div className="page-wrap py-8">
                <Link
                    href={href}
                    className="group flex items-center gap-4 border border-border bg-surface hover:border-accent/60 transition-colors p-4 sm:p-5"
                >
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center border border-border bg-background text-accent transition-colors group-hover:border-accent">
                        <Trophy className="h-5 w-5" />
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-accent">
                            <Sparkles className="h-2.5 w-2.5 text-white" />
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className={`font-mono text-[9px] font-black uppercase tracking-[0.18em] mb-0.5 ${meta.color}`}>
                            Quiz {meta.label}
                        </p>
                        <p className="text-[15px] font-black leading-tight tracking-[-0.02em] text-foreground group-hover:text-accent transition-colors">
                            {defaultTitle}
                        </p>
                        <p className="text-[12px] text-muted mt-0.5 line-clamp-1">{defaultDesc}</p>
                    </div>

                    <ArrowRight className="h-5 w-5 shrink-0 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </Link>
            </div>
        </div>
    )
}

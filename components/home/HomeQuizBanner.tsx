import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Trophy, ChevronRight, Sparkles } from 'lucide-react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export async function HomeQuizBanner({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.quiz' })
    const perguntas = [t('pergunta1'), t('pergunta2'), t('pergunta3')]
    return (
        <Link
            href="/quiz"
            className="group grid gap-4 border-y border-border py-5 transition-colors hover:border-accent sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center"
        >
            <div className="relative flex h-12 w-12 items-center justify-center border border-border bg-surface text-accent transition-colors group-hover:border-accent">
                <Trophy className="h-5 w-5" />
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-accent">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
            </div>

            <div className="min-w-0">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-accent">{t('eyebrow')}</p>
                <h2 className="mt-1 text-[18px] font-black leading-tight tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent sm:text-[20px]">
                    {t('titulo')}
                </h2>
                <p className="mt-1 text-sm text-muted">
                    {t('descricao')}
                </p>
                <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
                    {perguntas.map((q, i) => (
                        <span key={i} className="border border-border bg-surface px-2.5 py-1 text-[10px] text-muted">
                            {q}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <span className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-[12px] font-black uppercase tracking-[0.08em] text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                    {t('acao')}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>
        </Link>
    )
}

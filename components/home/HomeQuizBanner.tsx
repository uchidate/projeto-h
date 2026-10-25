import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export async function HomeQuizBanner({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.quiz' })
    return (
        <Link
            href="/quiz"
            className="group flex h-full flex-col justify-center gap-3 bg-[#0b0b0e] px-5 py-4 text-white transition-colors hover:bg-[#15151c]"
        >
            <div className="min-w-0">
                <p className="inline-block border border-[#ff7aa6] px-1.5 py-1 font-mono text-[11px] font-black uppercase leading-none tracking-[0.18em] text-[#ff7aa6]">{t('eyebrow')}</p>
                <h2 className="mt-2 font-serif text-[20px] font-medium leading-tight tracking-[-0.01em] text-white">
                    {t('titulo')}
                </h2>
                <p className="mt-1 truncate text-sm text-[#a8a8bc]">
                    {t('descricao')}
                </p>
            </div>

            <div>
                <span className="inline-flex items-center gap-2 bg-[#ff246e] px-5 py-3 text-[13px] font-black uppercase tracking-[0.08em] text-white">
                    {t('acao')}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>
        </Link>
    )
}

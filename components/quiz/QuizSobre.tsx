import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

const H2 = 'font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-tight sm:text-[30px]'

const FAQ_CHAVES = ['gratis', 'quantas', 'pontos', 'salvo'] as const

/** Perguntas frequentes do /quiz no idioma; alimentam o texto de apoio e o JSON-LD. */
export async function perguntasDoQuiz(locale: Locale): Promise<{ p: string; r: string }[]> {
    const t = await getTranslations({ locale, namespace: 'quiz.sobre.faq' })
    return FAQ_CHAVES.map(c => ({ p: t(`${c}.p`), r: t(`${c}.r`) }))
}

/** Texto de apoio do /quiz: explica o jogo para quem chega pelo Google e responde as dúvidas mais comuns. */
export async function QuizSobre({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
    const t = await getTranslations({ locale, namespace: 'quiz.sobre' })
    const faq = await perguntasDoQuiz(locale)
    const b = (c: React.ReactNode) => <strong>{c}</strong>
    return (
        <section aria-labelledby="quiz-sobre" className="mt-14 max-w-3xl space-y-8 text-[16px] leading-relaxed">
            <div>
                <h2 id="quiz-sobre" className={H2}>{t('h1')}</h2>
                <p className="mt-3">{t('p1')}</p>
            </div>
            <div>
                <h2 className={H2}>{t('h2')}</h2>
                <p className="mt-3">{t.rich('p2', { b })}</p>
                {locale === DEFAULT_LOCALE && (
                    <p className="mt-3">{t.rich('p3', { fandoms: c => <Link href={href('fandoms', undefined, locale)} className="font-bold underline">{c}</Link> })}</p>
                )}
            </div>
            <div>
                <h2 className={H2}>{t('h3')}</h2>
                <dl className="mt-4 space-y-4">
                    {faq.map(({ p, r }) => (
                        <div key={p}><dt className="font-black">{p}</dt><dd className="mt-1">{r}</dd></div>
                    ))}
                </dl>
            </div>
        </section>
    )
}

import type { Metadata } from 'next'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import QuizPage, { generateMetadata as metadataDoQuiz } from '@/components/quiz/QuizIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof QuizPage>[0]['searchParams']

/** O quiz existe em português, inglês, espanhol e japonês; outros idiomas veem a página em português com o aviso de que ainda não há tradução. */
const COM_QUIZ: readonly string[] = ['pt', 'en', 'es', 'ja']

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    if (COM_QUIZ.includes(locale)) return metadataDoQuiz({ locale: locale as Locale })
    return comoFallback(await metadataDoQuiz())
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (COM_QUIZ.includes(locale)) return <QuizPage searchParams={searchParams} locale={locale as Locale} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('quiz', undefined, DEFAULT_LOCALE)} />
            <QuizPage searchParams={searchParams} />
        </>
    )
}

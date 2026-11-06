import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { getAllFandoms } from '@/lib/wordpress/fandoms'
import { stripHtml } from '@/lib/utils'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { FandomsPage } from '@/components/fandoms/FandomsPage'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { QuizWidget } from '@/components/ui/QuizWidget'


type SearchParams = Promise<{ search?: string }>

export async function generateMetadata({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const [sp, t] = await Promise.all([searchParams, getTranslations({ locale, namespace: 'client.fandoms' })])
    const url = `${SITE_URL}${href('fandoms', undefined, locale)}${sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''}`
    const idiomas = Object.fromEntries([
        ...(['pt', 'en'] as const).map(l => [LOCALE_META[l].htmlLang, `${SITE_URL}${href('fandoms', undefined, l)}`]),
        ['x-default', `${SITE_URL}${href('fandoms', undefined, DEFAULT_LOCALE)}`],
    ])
    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        alternates: { canonical: url, ...(sp.search ? {} : { languages: idiomas }) },
        ...(sp.search ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function FandomsListPage({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const [sp, t] = await Promise.all([searchParams, getTranslations({ locale, namespace: 'client.fandoms' })])
    const fandoms = await getAllFandoms()
    const search = sp.search?.trim().toLowerCase()
    // A busca também casa o nome do grupo: quem procura a torcida do BTS digita
    // "BTS", não "ARMY". Casar só o nome do fandom exigia já saber a resposta.
    const filtered = search
        ? fandoms.filter(f =>
            f.name.toLowerCase().includes(search) ||
            f.groups.some(g => stripHtml(g.title.rendered).toLowerCase().includes(search)))
        : fandoms

    return (
        <>
            <PageBreadcrumb items={[{ name: t('breadcrumb'), path: href('fandoms', undefined, locale) }]} />
            <FandomsPage fandoms={filtered} search={sp.search} locale={locale} />
            <QuizWidget category="k-pop" title={t('quizTitle')} description={t('quizDescription')} />
        </>
    )
}

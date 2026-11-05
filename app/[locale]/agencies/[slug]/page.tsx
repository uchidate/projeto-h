import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { availableLocales, semTraducao } from '@/lib/i18n/entity-translation'
import { buildLanguageLinks } from '@/lib/i18n/language-links'
import { href } from '@/lib/i18n/routes'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { metadataDaAgencia } from '@/components/agencies/detail/lib/metadata'
import AgencyDetailPage from '@/components/agencies/detail/AgencyDetail'
import { getAgencyBySlug } from '@/lib/wordpress/agencies'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração (como era no português): renderização sob demanda com ISR.

/** Português: a ficha. Outros idiomas: a ficha traduzida; sem tradução publicada, a original fora do índice. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDaAgencia(slug, locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale: raw, slug } = await params
    entrarNaPagina(raw, { servePt: true })
    const locale = raw as Locale
    const found = await getAgencyBySlug(slug)
    if (!found) notFound()
    const [languageLinks, tSwitcher] = await Promise.all([
        buildLanguageLinks('agency', { slug }, locale, availableLocales(found)),
        getTranslations({ locale, namespace: 'entity.switcher' }),
    ])
    return (
        <>
            {semTraducao(found, locale) && <AvisoSemTraducao locale={locale} hrefOriginal={href('agency', { slug }, DEFAULT_LOCALE)} />}
            {languageLinks.length > 0 && <LanguageSwitcher availableIn={tSwitcher('availableIn')} dismissLabel={tSwitcher('dismiss')} links={languageLinks} />}
            <AgencyDetailPage params={Promise.resolve({ slug, locale })} />
        </>
    )
}

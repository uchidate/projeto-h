import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { availableLocales, semTraducao } from '@/lib/i18n/entity-translation'
import { buildLanguageLinks } from '@/lib/i18n/language-links'
import { href } from '@/lib/i18n/routes'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import FoodPage, { generateMetadata as metadataDaFicha, slugsPreGerados } from '@/components/comidas/FoodDetail'
import { getFoodBySlug } from '@/lib/wordpress/foods'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string; slug: string }>

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, slug }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem `slug` e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os slugs. Os outros idiomas renderizam sob demanda com ISR.
export async function generateStaticParams() {
    return (await slugsPreGerados()).map(item => ({ locale: DEFAULT_LOCALE, ...item }))
}

/** Português: a ficha. Outros idiomas: a ficha traduzida; sem tradução publicada, a original fora do índice. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDaFicha({ params: Promise.resolve({ slug, locale }) })
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    const found = await getFoodBySlug(slug)
    if (!found) notFound()
    const [languageLinks, tSwitcher] = await Promise.all([
        buildLanguageLinks('food', { slug }, locale, availableLocales(found)),
        getTranslations({ locale, namespace: 'entity.switcher' }),
    ])
    return (
        <>
            {semTraducao(found, locale) && <AvisoSemTraducao locale={locale} hrefOriginal={href('food', { slug }, DEFAULT_LOCALE)} />}
            {languageLinks.length > 0 && <LanguageSwitcher availableIn={tSwitcher('availableIn')} dismissLabel={tSwitcher('dismiss')} links={languageLinks} />}
            <FoodPage params={Promise.resolve({ slug, locale })} />
        </>
    )
}

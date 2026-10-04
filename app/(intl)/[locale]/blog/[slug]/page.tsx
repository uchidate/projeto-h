import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { getPostBySlug } from '@/lib/wordpress/posts'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { LocalizedPost, buildLocalizedPostMetadata } from '@/components/blog/LocalizedPost'
import PostPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/blog/[slug]/page'

export const revalidate = 300

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: renderização sob demanda com ISR, como as fichas traduzidas.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    // Post próprio no idioma (D5-a): indexável, canonical e hreflang da própria versão.
    const traduzido = await getPostBySlug(slug, locale)
    if (traduzido) return buildLocalizedPostMetadata(traduzido, locale)
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ slug }) }))
}

export default async function IntlPostPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)

    const traduzido = await getPostBySlug(slug, locale)
    if (traduzido) return <LocalizedPost post={traduzido} locale={locale} />

    // Slug do original em português que já tem tradução: vai para a versão traduzida.
    const original = await getPostBySlug(slug)
    const slugTraduzido = original?.translations?.[locale]
    if (slugTraduzido && slugTraduzido !== slug) permanentRedirect(href('post', { slug: slugTraduzido }, locale))

    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('post', { slug }, DEFAULT_LOCALE)} />
            <PostPage params={Promise.resolve({ slug })} />
        </>
    )
}

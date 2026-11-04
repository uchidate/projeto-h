import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { resolverPostIntl } from '@/lib/blog/resolverPostIntl'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { LocalizedPost, buildLocalizedPostMetadata } from '@/components/blog/LocalizedPost'
import PostPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/blog/[slug]/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 300

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: renderização sob demanda com ISR, como as fichas traduzidas.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale)) return {}
    // Post próprio no idioma (D5-a): indexável, canonical e hreflang da própria versão.
    const resolvido = await resolverPostIntl(slug, locale)
    if (resolvido.tipo === 'traduzido') return buildLocalizedPostMetadata(resolvido.post, locale)
    if (resolvido.tipo === 'redirecionar') return {}
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ slug }) }))
}

export default async function IntlPostPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale)

    const resolvido = await resolverPostIntl(slug, locale)
    if (resolvido.tipo === 'traduzido') return <LocalizedPost post={resolvido.post} locale={locale} />
    // Slug antigo da tradução (indexado antes do slug único): vai para o slug do original.
    if (resolvido.tipo === 'redirecionar') permanentRedirect(href('post', { slug: resolvido.slug }, locale))

    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('post', { slug }, DEFAULT_LOCALE)} />
            <PostPage params={Promise.resolve({ slug })} />
        </>
    )
}

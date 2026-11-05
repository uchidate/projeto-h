import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { metadataDaAgencia } from '@/components/agencies/detail/lib/metadata'
import AgencyDetailPage from '@/components/agencies/detail/AgencyDetail'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração (como era no português): renderização sob demanda com ISR.

/** Português: a ficha. Outros idiomas: a mesma ficha com o aviso de que ainda não há tradução. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataDaAgencia(slug)
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <AgencyDetailPage params={Promise.resolve({ slug })} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('agency', { slug }, DEFAULT_LOCALE)} />
            <AgencyDetailPage params={Promise.resolve({ slug })} />
        </>
    )
}

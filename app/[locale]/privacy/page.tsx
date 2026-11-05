import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import Pagina, { metadata as metadataEmPortugues } from '@/components/legal/PrivacidadePagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataEmPortugues : comoFallback(metadataEmPortugues)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <Pagina />
    // Texto legal só é traduzido com revisão humana (docs/I18N-V2.md, §7): até lá, o original com aviso e noindex.
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('privacy', undefined, DEFAULT_LOCALE)} />
            <Pagina />
        </>
    )
}

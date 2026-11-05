import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import Pagina, { metadata as metadataEmPortugues } from '@/components/conta/PerfilPagina'

// Conta: sempre dinâmica (sessão) e noindex. Fora do português é o mesmo corpo, com aviso de falta de tradução.
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataEmPortugues : comoFallback(metadataEmPortugues)
}

export default async function Page({ params }: Props) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <Pagina locale={locale} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('profile', undefined, DEFAULT_LOCALE)} />
            <Pagina locale={locale} />
        </>
    )
}

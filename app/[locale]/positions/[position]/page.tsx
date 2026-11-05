import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { VALID_POSITIONS } from '@/lib/constants/positions'
import PositionPage, { generateMetadata as metadataEmPortugues } from '@/components/positions/PositionDetail'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 1800

type Params = Promise<{ locale: string; position: string }>

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, slug }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem `slug` e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os slugs (o build caía de 1005 para 639 páginas).
// Os outros idiomas renderizam sob demanda com ISR; só itens com tradução publicada têm página (D5-b).
export async function generateStaticParams() {
    return VALID_POSITIONS.map(position => ({ locale: DEFAULT_LOCALE, position }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, position } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues({ params: Promise.resolve({ position }) })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params }: { params: Params }) {
    const { locale, position } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <PositionPage params={Promise.resolve({ position })} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('position', { position }, DEFAULT_LOCALE)} />
            <PositionPage params={Promise.resolve({ position })} />
        </>
    )
}

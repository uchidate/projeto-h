import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import Pagina, { metadataDaPagina } from '@/components/conta/MinhasListasPagina'

// Conta: sempre dinâmica (sessão) e noindex. Fora do português é o mesmo corpo, com aviso de falta de tradução.
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDaPagina(locale as Locale)
}

export default async function Page({ params, searchParams }: Props) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <Pagina locale={locale as Locale} searchParams={searchParams} />
}

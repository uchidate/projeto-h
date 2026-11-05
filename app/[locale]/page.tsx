import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import HomePt, { generateMetadata as metadataPt } from '@/components/home/HomePt'
import { HomeIntl, generateMetadataHomeIntl } from '@/components/home/HomeIntl'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// 10 minutos: publicar dispara revalidação sob demanda pelo webhook, então o tempo aqui é só a rede de segurança.
// Com 60 s a home ficava permanentemente STALE (x-nextjs-cache: STALE em toda requisição).
export const revalidate = 600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataPt() : generateMetadataHomeIntl(locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <HomePt />
    return <HomeIntl locale={locale} />
}

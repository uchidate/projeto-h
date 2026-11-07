import type { Metadata } from 'next'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { href, type RouteName } from './routes'
import type { Locale } from './config'

type Entrada = {
    locale: Locale
    rota: RouteName
    params?: Record<string, string>
    titulo: string
    descricao?: string
    /** Query string já montada (com `?`), anexada ao canonical. */
    consulta?: string
    robots?: Metadata['robots']
}

/** Metadados comuns de página: título, descrição, canonical no idioma, Open Graph e Twitter. */
export function metadataDaRota({ locale, rota, params, titulo, descricao, consulta = '', robots }: Entrada): Metadata {
    const caminho = (href as unknown as (r: RouteName, p: Record<string, string> | undefined, l: Locale) => string)(rota, params, locale)
    const url = `${SITE_URL}${caminho}${consulta}`
    return {
        title: titulo,
        ...(descricao ? { description: descricao } : {}),
        alternates: { canonical: url },
        openGraph: baseOG(url),
        twitter: baseTwitter(),
        ...(robots ? { robots } : {}),
    }
}

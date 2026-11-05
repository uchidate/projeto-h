import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { GuiaPagina, CHAVES_FILTRO_GUIA, buildGuiaMetadata, type SearchParamsGuia } from '@/components/guias/GuiaPagina'
import { href } from '@/lib/i18n/routes'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

interface Props {
    params: Promise<{ locale: string; slug: string }>
    searchParams: Promise<SearchParamsGuia>
}

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/guias/<slug>?genre=…` para cá, mantendo a
// URL pública. O canonical continua apontando para o guia, como antes do desvio. Só o português filtra.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return buildGuiaMetadata({ params: Promise.resolve({ slug }) })
}

export default async function Page({ params, searchParams }: Props) {
    const { locale, slug } = await params
    entrarNaPagina(locale, { servePt: true })
    const sp = await searchParams
    // Acesso direto sem filtro: volta para a versão estática.
    if (!CHAVES_FILTRO_GUIA.some(chave => sp[chave] !== undefined)) redirect(href('guide', { slug }, locale))
    return <GuiaPagina slug={slug} sp={sp} />
}

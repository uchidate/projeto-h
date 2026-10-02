import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { GuiaPagina, CHAVES_FILTRO_GUIA, buildGuiaMetadata, type SearchParamsGuia } from '@/app/(site)/guias/[slug]/GuiaPagina'

interface Props {
    params: Promise<{ slug: string }>
    searchParams: Promise<SearchParamsGuia>
}

// Rota interna: next.config.mjs reescreve /guias/<slug>?genre=… para cá, mantendo a
// URL pública. O canonical continua apontando para o guia, como antes do desvio.
export async function generateMetadata(props: Props): Promise<Metadata> {
    return buildGuiaMetadata(props)
}

export default async function GuiaFiltradoPage({ params, searchParams }: Props) {
    const { slug } = await params
    const sp = await searchParams
    // Acesso direto sem filtro: volta para a versão estática.
    if (!CHAVES_FILTRO_GUIA.some(chave => sp[chave] !== undefined)) redirect(`/guias/${slug}`)
    return <GuiaPagina slug={slug} sp={sp} />
}

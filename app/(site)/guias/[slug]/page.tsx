import type { Metadata } from 'next'
import { getAllHubs } from '@/lib/guias'
import { GuiaPagina, buildGuiaMetadata } from '@/app/(site)/guias/[slug]/GuiaPagina'

interface Props {
    params: Promise<{ slug: string }>
}

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`, Cloudflare em BYPASS, toda visita renderiza na
// origem; medido em 2026-10-02). Filtros e paginação (?genre=, ?page=, …) são
// desviados para ./filtrado por um rewrite em next.config.mjs.
export const revalidate = 3600

export async function generateStaticParams() {
    const hubs = await getAllHubs()
    return hubs.map((hub) => ({ slug: hub.slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    return buildGuiaMetadata(props)
}

export default async function GuiaSlugPage({ params }: Props) {
    const { slug } = await params
    return <GuiaPagina slug={slug} sp={{}} />
}

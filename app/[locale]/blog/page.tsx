import type { Metadata } from 'next'
import { BlogListagem, metadataBlogListagem } from '@/components/blog/BlogListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Estática de propósito, nos dois idiomas: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite (lista em
// lib/i18n/rotas-migradas.mjs) manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 300

type Params = Promise<{ locale: string }>

const SEM_FILTRO = Promise.resolve({})

/** A mesma listagem nos dois idiomas; fora do português só entram artigos com tradução publicada. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataBlogListagem({ searchParams: SEM_FILTRO, locale })
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <BlogListagem searchParams={SEM_FILTRO} locale={locale} />
}

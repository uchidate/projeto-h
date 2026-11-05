import type { Metadata } from 'next'
import { BlogListagem, metadataBlogListagem } from '@/components/blog/BlogListagem'
import { LocalizedBlogList, buildLocalizedBlogMetadata } from '@/components/blog/LocalizedBlogList'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Estática de propósito, nos dois idiomas: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite (lista em
// lib/i18n/rotas-migradas.mjs) manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 300

type Params = Promise<{ locale: string }>

const SEM_FILTRO = Promise.resolve({})

/** Português: a listagem completa, com filtros. Outros idiomas: o catálogo de fichas traduzidas. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataBlogListagem({ searchParams: SEM_FILTRO }) : buildLocalizedBlogMetadata(locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return locale === DEFAULT_LOCALE
        ? <BlogListagem searchParams={SEM_FILTRO} />
        : <LocalizedBlogList locale={locale} />
}

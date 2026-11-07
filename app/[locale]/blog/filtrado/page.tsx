import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BlogListagem, metadataBlogListagem, type SearchParams } from '@/components/blog/BlogListagem'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import { href } from '@/lib/i18n/routes'

// Rota interna: o rewrite de lib/i18n/rotas-migradas.mjs manda `/blog?<filtro>` (e `/en/blog?page=`)
// para cá, mantendo a URL pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 300

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataBlogListagem({ searchParams, locale })
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    const sp = await searchParams
    if (Object.keys(sp).length === 0) redirect(href('blog', undefined, locale))
    return <BlogListagem searchParams={searchParams} locale={locale} />
}

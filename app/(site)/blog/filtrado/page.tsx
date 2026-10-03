import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BlogListagem, metadataBlogListagem, type SearchParams } from '@/app/(site)/blog/BlogListagem'

// Rota interna: next.config.mjs reescreve /blog?<filtro> para cá, mantendo a URL
// pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 300

async function semFiltro(searchParams: SearchParams) {
    return Object.keys(await searchParams).length === 0
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    return metadataBlogListagem({ searchParams })
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
    if (await semFiltro(searchParams)) redirect('/blog')
    return <BlogListagem searchParams={searchParams} />
}

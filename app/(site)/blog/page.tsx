import type { Metadata } from 'next'
import { BlogListagem, metadataBlogListagem } from '@/app/(site)/blog/BlogListagem'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite em
// next.config.mjs manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 300

const SEM_FILTRO = Promise.resolve({})

export function generateMetadata(): Promise<Metadata> {
    return metadataBlogListagem({ searchParams: SEM_FILTRO })
}

export default function Page() {
    return <BlogListagem searchParams={SEM_FILTRO} />
}

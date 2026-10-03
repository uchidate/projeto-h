import type { Metadata } from 'next'
import { ComidasListagem, metadataComidas } from '@/app/(site)/comidas/ComidasListagem'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite em
// next.config.mjs manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 600

const SEM_FILTRO = Promise.resolve({})

export function generateMetadata(): Promise<Metadata> {
    return metadataComidas({ searchParams: SEM_FILTRO })
}

export default function Page() {
    return <ComidasListagem searchParams={SEM_FILTRO} />
}

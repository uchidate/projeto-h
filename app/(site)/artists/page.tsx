import type { Metadata } from 'next'
import { ArtistsListagem, metadataArtistsListagem } from '@/app/(site)/artists/ArtistsListagem'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro, paginação ou busca, um rewrite em
// next.config.mjs manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 600

const SEM_FILTRO = Promise.resolve({})

export function generateMetadata(): Promise<Metadata> {
    return metadataArtistsListagem({ searchParams: SEM_FILTRO })
}

export default function Page() {
    return <ArtistsListagem searchParams={SEM_FILTRO} />
}

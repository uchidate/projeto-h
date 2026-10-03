import type { Metadata } from 'next'
import { LojaListagem, metadataLoja } from '@/app/(site)/loja/LojaListagem'

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`). Com filtro ou busca, um rewrite em
// next.config.mjs manda a mesma URL para ./filtrado, que lê a query.
export const revalidate = 300

const SEM_FILTRO = Promise.resolve({})

export function generateMetadata(): Metadata {
    return metadataLoja
}

export default function Page() {
    return <LojaListagem searchParams={SEM_FILTRO} />
}

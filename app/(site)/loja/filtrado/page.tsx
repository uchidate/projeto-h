import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LojaListagem, metadataLoja, type SearchParams } from '@/app/(site)/loja/LojaListagem'

// Rota interna: next.config.mjs reescreve /loja?<filtro> para cá, mantendo a URL
// pública. O canonical continua apontando para /loja.
export const revalidate = 300

export function generateMetadata(): Metadata {
    return metadataLoja
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
    if (Object.keys(await searchParams).length === 0) redirect('/loja')
    return <LojaListagem searchParams={searchParams} />
}

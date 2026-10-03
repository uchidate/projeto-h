import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ComidasListagem, metadataComidas, type SearchParams } from '@/app/(site)/comidas/ComidasListagem'

// Rota interna: next.config.mjs reescreve /comidas?<filtro> para cá, mantendo a URL
// pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    return metadataComidas({ searchParams })
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
    if (Object.keys(await searchParams).length === 0) redirect('/comidas')
    return <ComidasListagem searchParams={searchParams} />
}

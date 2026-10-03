import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GroupsListagem, metadataGroupsListagem, type SearchParams } from '@/app/(site)/groups/GroupsListagem'

// Rota interna: next.config.mjs reescreve /groups?<filtro> para cá, mantendo a URL
// pública. Canonical e robots saem da mesma lógica da listagem.
export const revalidate = 600

async function semFiltro(searchParams: SearchParams) {
    return Object.keys(await searchParams).length === 0
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    return metadataGroupsListagem({ searchParams })
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
    if (await semFiltro(searchParams)) redirect('/groups')
    return <GroupsListagem searchParams={searchParams} />
}

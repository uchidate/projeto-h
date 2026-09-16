import type { Metadata } from 'next'
import { getAllFandoms } from '@/lib/wordpress/fandoms'
import { stripHtml } from '@/lib/utils'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { FandomsPage } from '@/components/features/FandomsPage'

export const revalidate = 600

type SearchParams = Promise<{ search?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const url = `${SITE_URL}/fandoms${sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''}`
    return {
        title: 'Fandoms K-Pop',
        description: 'Fandoms de K-Pop — cores oficiais, lightsticks e os grupos de cada torcida, em português.',
        alternates: { canonical: url },
        ...(sp.search ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function FandomsListPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const fandoms = await getAllFandoms()
    const search = sp.search?.trim().toLowerCase()
    // A busca também casa o nome do grupo: quem procura a torcida do BTS digita
    // "BTS", não "ARMY". Casar só o nome do fandom exigia já saber a resposta.
    const filtered = search
        ? fandoms.filter(f =>
            f.name.toLowerCase().includes(search) ||
            f.groups.some(g => stripHtml(g.title.rendered).toLowerCase().includes(search)))
        : fandoms

    return <FandomsPage fandoms={filtered} search={sp.search} />
}

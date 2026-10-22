import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCompaniesByChaebolGroup, getAllCompaniesRaw, rotuloDoSetor, emojiDoSetor } from '@/lib/wordpress/companies'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml, slugify } from '@/lib/utils'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'

export const revalidate = 1800

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    try {
        const all = await getAllCompaniesRaw()
        const groups = new Set(all.map(c => c.acf?.chaebol_group).filter((g): g is string => !!g))
        return [...groups].map(g => ({ slug: slugify(g) }))
    } catch { return [] }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const result = await getCompaniesByChaebolGroup(slug)
    if (!result) return {}

    const url = `${SITE_URL}/empresas/grupo/${slug}`
    const title = `${result.groupName} — todas as empresas do grupo`
    const description = `Conheça todas as empresas do ${result.groupName}: ${result.companies.map(c => stripHtml(c.title.rendered)).join(', ')}.`

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function ChaebolGroupPage({ params }: { params: Params }) {
    const { slug } = await params
    const result = await getCompaniesByChaebolGroup(slug)
    if (!result) notFound()
    const { groupName, companies } = result

    const url = `${SITE_URL}/empresas/grupo/${slug}`
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Empresas', url: `${SITE_URL}/empresas` },
        { name: groupName, url },
    ])

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Empresas', path: '/empresas' }, { name: groupName, path: `/empresas/grupo/${slug}` }]} />
            <JsonLd data={breadcrumbSchema} />
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Grupo empresarial</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">{groupName}</h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        {companies.length} empresa{companies.length !== 1 ? 's' : ''} ligada{companies.length !== 1 ? 's' : ''} ao {groupName} no acervo.
                    </p>
                </div>
            </div>

            <div className="page-wrap py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(company => {
                        const name = stripHtml(company.title.rendered)
                        const acf = company.acf ?? {}
                        const img = company.featured_image_url
                        const indLabel = rotuloDoSetor(acf.industry)
                        const indEmoji = emojiDoSetor(acf.industry)

                        return (
                            <Link key={company.id} href={`/empresas/${company.slug}`}
                                className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-accent transition-colors bg-background hover:bg-surface/60">
                                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-surface border border-border group-hover:border-accent transition-colors flex items-center justify-center">
                                    {img ? (
                                        <Image src={img} alt={name} fill className="object-contain p-1" sizes="56px" />
                                    ) : (
                                        <span className="text-[24px]">{indEmoji}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-1">{name}</p>
                                    {indLabel && (
                                        <p className="font-mono text-[10px] text-muted/70 mt-1">{indLabel}</p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
                <div className="mt-6">
                    <Link href="/empresas" className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
                        ← Ver todas as empresas
                    </Link>
                </div>
            </div>
        </>
    )
}

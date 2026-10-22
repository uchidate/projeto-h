import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import { getCompanyBySlug } from '@/lib/wordpress/companies'
import { getVitrineVinculada } from '@/lib/wordpress/vitrine'
import { StoreCard } from '@/components/ui/StoreCard'
import { SITE_URL, SITE_NAME, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'

export const revalidate = 300

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)
    if (!company) return {}
    const name = stripHtml(company.title.rendered)
    const url = `${SITE_URL}/loja/empresa/${slug}`
    return {
        title: `Loja ${name}`,
        description: `Produtos de ${name} selecionados pela curadoria ${SITE_NAME}.`,
        alternates: { canonical: url },
        openGraph: { ...baseOG(url), title: `Loja ${name} — ${SITE_NAME}` },
        twitter: { ...baseTwitter() },
    }
}

export default async function LojaEmpresaPage({ params }: { params: Params }) {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)
    if (!company) notFound()

    const acf = company.acf ?? {}
    const name = stripHtml(company.title.rendered)
    const img = getWPImage(company._embedded, company.featured_image_url, name)
    const contexto = `loja_empresa:${slug}`
    const produtos = await getVitrineVinculada(
        acf.linked_products,
        [name, ...(acf.global_brands ?? []), ...(acf.famous_products ?? [])],
        contexto,
        { limit: 60 },
    )

    return (
        <main className="min-h-screen bg-background pb-20">
            <section className="page-wrap pb-2 pt-6 sm:pt-7">
                <div className="flex items-center gap-4">
                    {img && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-border">
                            <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="64px" />
                        </div>
                    )}
                    <h1 className="font-[family-name:var(--font-playfair)] text-[28px] font-bold leading-none sm:text-[38px]">
                        Loja {name}<span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</span>
                    </h1>
                </div>
                <p className="mt-3 flex items-start gap-2 text-[12px] text-muted">
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    Os links desta página são de afiliados. Você paga o mesmo preço — a comissão ajuda a manter o {SITE_NAME} no ar.
                </p>
            </section>

            <div className="page-wrap py-6">
                {produtos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Ainda não temos produtos de {name} na loja.</p>
                        <Link href="/loja" className="text-[13px] font-semibold text-accent hover:underline">Ver a loja inteira →</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {produtos.map(p => <StoreCard key={p.id} product={p} contexto={contexto} />)}
                    </div>
                )}
                <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6">
                    <Link href={`/empresas/${slug}`} className="font-mono text-[12px] font-semibold text-muted transition-colors hover:text-foreground">
                        ← Ver ficha de {name}
                    </Link>
                    <Link href="/loja" className="font-mono text-[12px] font-semibold text-muted transition-colors hover:text-foreground">
                        Ver a loja inteira →
                    </Link>
                </div>
            </div>
        </main>
    )
}

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import { getArtistBySlug } from '@/lib/wordpress/artists'
import { getStoreProductsByArtistId, ordenarPrateleira } from '@/lib/wordpress/store'
import { StoreCard } from '@/components/ui/StoreCard'
import { SITE_URL, SITE_NAME, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'

export const revalidate = 300

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const artist = await getArtistBySlug(slug)
    if (!artist) return {}
    const name = stripHtml(artist.title.rendered)
    const url = `${SITE_URL}/loja/artista/${slug}`
    return {
        title: `Loja ${name}`,
        description: `Produtos relacionados a ${name} selecionados pela curadoria ${SITE_NAME}: álbuns, photocards, lightsticks e mais.`,
        alternates: { canonical: url },
        openGraph: { ...baseOG(url), title: `Loja ${name} — ${SITE_NAME}` },
        twitter: { ...baseTwitter() },
    }
}

export default async function LojaArtistaPage({ params }: { params: Params }) {
    const { slug } = await params
    const artist = await getArtistBySlug(slug)
    if (!artist) notFound()

    const name = stripHtml(artist.title.rendered)
    const img = getWPImage(artist._embedded, artist.featured_image_url, name)
    const produtos = ordenarPrateleira(await getStoreProductsByArtistId(artist.id))

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
                        {produtos.map(p => <StoreCard key={p.id} product={p} />)}
                    </div>
                )}
                <div className="mt-10 border-t border-border pt-6">
                    <Link href="/loja" className="font-mono text-[12px] font-semibold text-muted transition-colors hover:text-foreground">
                        ← Ver a loja inteira
                    </Link>
                </div>
            </div>
        </main>
    )
}

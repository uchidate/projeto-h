import type { Metadata } from 'next'
import Link from 'next/link'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { BlogGuiaCard } from '@/components/blog/BlogGuiaCard'
import { ShopRelatedSection } from '@/components/ui/ShopRelatedSection'
import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { getStoreProducts } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { produtosDaCategoria } from '@/lib/blog/categoriaLoja'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'

const URL_MERCH = `${SITE_URL}/merch`

export const metadata: Metadata = {
    title: 'Merch de K-pop: lightstick, photocard e álbum físico',
    description: 'Guias para colecionar K-pop: como escolher lightstick, guardar photocards, entender as versões do álbum físico e onde comprar no Brasil.',
    alternates: { canonical: URL_MERCH },
    openGraph: baseOG(URL_MERCH),
    twitter: baseTwitter(),
}

const PRATELEIRAS = [
    { categoria: 'lightstick', titulo: 'Lightsticks', verTudo: 'Ver todos os lightsticks' },
    { categoria: 'photocard', titulo: 'Photocards', verTudo: 'Ver todos os photocards' },
    { categoria: 'kpop_album', titulo: 'Álbuns de K-pop', verTudo: 'Ver todos os álbuns' },
]

/** Guias da categoria Merch e produtos de cada prateleira; falha do WordPress deixa a página sem a parte que faltou. */
async function carregar() {
    const [artigos, produtos] = await Promise.all([
        Promise.all([getPosts({ category: 'merch', perPage: 12, includeContent: false }), getCategories()])
            .then(([{ items }, categorias]) => ({ posts: items, categoryMap: Object.fromEntries(categorias.map(c => [c.id, { name: c.name, slug: c.slug }])) }))
            .catch(() => null),
        getStoreProducts().catch(() => []),
    ])
    return { artigos, produtos }
}

export default async function Page() {
    const { artigos, produtos } = await carregar()
    return (
        <>
            <PageBreadcrumb items={[{ name: 'Merch', path: '/merch' }]} />
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Colecionismo</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">Merch de K-pop</h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        Lightstick, photocard, álbum físico e roupa de turnê: o que cada item é, como escolher a versão certa e onde comprar no Brasil.
                    </p>
                </div>
            </div>

            {artigos && artigos.posts.length > 0 && (
                <section data-bloco="merch-artigos" className="border-b border-border/40">
                    <div className="page-wrap py-8">
                        <div className="mb-4 flex items-baseline gap-3">
                            <h2 className="font-serif text-[24px] font-semibold leading-tight sm:text-[28px]">Guias de merch</h2>
                            <Link href="/blog?category=merch" className="ml-auto shrink-0 font-mono text-[11px] text-muted transition-colors hover:text-accent">todos os artigos →</Link>
                        </div>
                        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {artigos.posts.map(p => <BlogGuiaCard key={p.id} post={p} categoryMap={artigos.categoryMap} />)}
                        </div>
                    </div>
                </section>
            )}

            {PRATELEIRAS.map(({ categoria, titulo, verTudo }) => {
                const lista = ordenarPrateleira(produtosDaCategoria(produtos, [categoria]), 'merch:lista').slice(0, 10)
                return lista.length >= 4 ? (
                    <ShopRelatedSection
                        key={categoria}
                        title={`Na loja: ${titulo}`}
                        products={lista}
                        href={`/loja?categoria=${categoria}`}
                        verTudoLabel={verTudo}
                        contexto="merch:lista"
                        bloco={`merch-vitrine-${categoria}`}
                    />
                ) : null
            })}
        </>
    )
}

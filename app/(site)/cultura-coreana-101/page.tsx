import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { StoreCard } from '@/components/ui/StoreCard'
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb'
import { JsonLd } from '@/components/seo/JsonLd'
import { ADSENSE } from '@/lib/config/ads'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { escolherFichas, type FichaDoTema } from '@/lib/home/temas'
import { dataRelativa } from '@/lib/home/data-relativa'
import { getCompanies } from '@/lib/wordpress/companies'
import { getFoods } from '@/lib/wordpress/foods'
import { getPosts } from '@/lib/wordpress/posts'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import { getWPImage, stripHtml } from '@/lib/utils'

const PAGE_URL = `${SITE_URL}/cultura-coreana-101`
const TITLE = 'Cultura e Gastronomia Coreana: Guias, Pratos e Marcas'
const DESCRIPTION = 'Hangeul, honoríficos, festas tradicionais, pratos, marcas de comida e bebida: o essencial da cultura coreana reunido num lugar só, com guias para quem está começando.'

export const revalidate = 3600

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    openGraph: { ...baseOG(PAGE_URL), title: TITLE, description: DESCRIPTION },
    twitter: { ...baseTwitter(), title: TITLE, description: DESCRIPTION },
}

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'
const COR_CULTURA = '#6d3fc0'
const COR_COMIDA = '#b4531a'
const COR_LOJA = '#ff246e'

const lista = { items: [], total: 0, totalPages: 0 }
const ou = <T,>(valor: T) => (r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : valor)

function Capitulo({ n, titulo, sub, cor, id }: { n: number; titulo: string; sub: string; cor: string; id: string }) {
    return (
        <div id={id} className="flex scroll-mt-24 items-center gap-3">
            <span aria-hidden className="h-3 w-3 shrink-0" style={{ backgroundColor: cor }} />
            <h2 className="whitespace-nowrap font-mono text-[11px] font-black uppercase tracking-[0.18em] text-foreground">{`0${n} · ${titulo}`}</h2>
            <span aria-hidden className="h-0.5 min-w-4 flex-1 opacity-35" style={{ backgroundColor: cor }} />
            <span className="hidden whitespace-nowrap text-[12px] text-muted lg:block">{sub}</span>
        </div>
    )
}

function Ficha({ ficha, base, cor }: { ficha: FichaDoTema; base: string; cor: string }) {
    return (
        <Link href={`${base}/${ficha.slug}`} className="group block border border-border bg-background transition-colors hover:border-foreground">
            <span className="relative block aspect-[16/10] overflow-hidden bg-white">
                <Image src={ficha.imagem} alt={ficha.nome} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw" className="object-contain p-2 transition-transform group-hover:scale-[1.03]" />
            </span>
            <span className="block px-3 py-2.5">
                <span className="block text-[14px] font-bold leading-tight text-foreground group-hover:text-accent">{ficha.nome}</span>
                {ficha.naLoja > 0 && <span className={`mt-1 block ${MONO} text-[9px]`} style={{ color: cor }}>{ficha.naLoja} na loja</span>}
            </span>
        </Link>
    )
}

function VerTodos({ href, children, cor }: { href: string; children: React.ReactNode; cor: string }) {
    return (
        <Link href={href} className={`inline-block border-b-2 pb-0.5 text-foreground ${MONO}`} style={{ borderColor: cor }}>{children}</Link>
    )
}

export default async function CulturaCoreanaPage() {
    const [settings, comidas, empresas, artigos, prateleira] = await Promise.allSettled([
        getSiteSettings(),
        getFoods({ perPage: 100 }),
        getCompanies({ industry: 'food_beverage', perPage: 100 }),
        getPosts({ tag: 'comida-coreana', perPage: 3, includeContent: false }),
        getVitrinePorTermos([], 'hub_cultura', { limit: 5, temas: ['culinaria'] }),
    ])
    const guias = ou<Awaited<ReturnType<typeof getSiteSettings>> | null>(null)(settings)?.cultureGuides ?? []
    const fo = ou<Awaited<ReturnType<typeof getFoods>>>(lista)(comidas)
    const ec = ou<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresas)
    const posts = ou<Awaited<ReturnType<typeof getPosts>>>(lista)(artigos)
    const produtos = ou<Awaited<ReturnType<typeof getVitrinePorTermos>>>([])(prateleira).filter(p => p.acf.affiliate_url).slice(0, 5)
    const pratos = escolherFichas(fo.items, 8)
    const marcas = escolherFichas(ec.items, 6)

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
    }

    const atalhos = [
        guias.length > 0 && { id: 'guias', rotulo: 'Guias de cultura', n: guias.length, cor: COR_CULTURA },
        pratos.length > 0 && { id: 'pratos', rotulo: 'Pratos', n: fo.total, cor: COR_COMIDA },
        marcas.length > 0 && { id: 'marcas', rotulo: 'Marcas', n: ec.total, cor: COR_COMIDA },
    ].filter(Boolean) as { id: string; rotulo: string; n: number; cor: string }[]

    let n = 0

    return (
        <>
            <JsonLd data={jsonLd} />
            <PageBreadcrumb crumbs={[{ label: 'Início', href: '/' }, { label: 'Cultura e Gastronomia' }]} />

            <div className="page-wrap space-y-10 py-8">
                <header className="border-b-2 border-foreground pb-6">
                    <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">Comece por aqui</p>
                    <h1 className="font-serif text-[38px] font-medium leading-[0.98] tracking-[-0.02em] sm:text-[54px]">Cultura e gastronomia coreana</h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70 sm:text-[17px]">
                        Do alfabeto coreano às festas tradicionais, do kimchi ao soju: o que aparece o tempo todo no k-drama e no k-pop,
                        explicado em guias e fichas, com os pratos e as marcas por trás deles.
                    </p>
                    {atalhos.length > 0 && (
                        <nav aria-label="Seções desta página" className="mt-5 flex flex-wrap gap-2">
                            {atalhos.map(a => (
                                <a key={a.id} href={`#${a.id}`} className={`border-2 px-3 py-2 leading-none text-foreground transition-colors hover:bg-surface ${MONO}`} style={{ borderColor: a.cor }}>
                                    {a.rotulo} <span className="text-muted">· {a.n}</span>
                                </a>
                            ))}
                        </nav>
                    )}
                </header>

                {guias.length > 0 && (
                    <section aria-label="Guias de cultura" className="space-y-5">
                        <Capitulo n={++n} id="guias" titulo="Cultura" sub="Os conceitos que toda produção coreana usa" cor={COR_CULTURA} />
                        <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                            {guias.map(guia => (
                                <li key={guia.href}>
                                    <Link href={guia.href} className="group flex h-full items-center gap-3 bg-background p-5 transition-colors hover:bg-surface">
                                        <span className="shrink-0 text-[28px] leading-none" aria-hidden="true">{guia.emoji}</span>
                                        <span className="text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent">{guia.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <VerTodos href="/guias" cor={COR_CULTURA}>Ver todos os guias →</VerTodos>
                    </section>
                )}

                {ADSENSE.slots.inline && guias.length > 0 && (
                    <div className="empty:hidden">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="cultura_101" />
                    </div>
                )}

                {(pratos.length > 0 || posts.items.length > 0) && (
                    <section aria-label="Gastronomia" className="space-y-5">
                        <Capitulo n={++n} id="pratos" titulo="Gastronomia" sub={`${fo.total} pratos catalogados`} cor={COR_COMIDA} />
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {pratos.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {pratos.map(f => <Ficha key={f.slug} ficha={f} base="/comidas" cor={COR_COMIDA} />)}
                                </div>
                            )}
                            {posts.items.length > 0 && (
                                <div>
                                    <p className={`mb-2 text-[9px] ${MONO}`} style={{ color: COR_COMIDA }}>Para ler</p>
                                    <ul>
                                        {posts.items.map(post => {
                                            const imagem = getWPImage(post._embedded, post.featured_image_url)
                                            return (
                                                <li key={post.id} className="border-t border-border first:border-t-0">
                                                    <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3 py-3">
                                                        <span className="relative aspect-video w-24 shrink-0 overflow-hidden bg-surface">
                                                            {imagem && <Image src={imagem.src} alt="" fill sizes="96px" className="object-cover" />}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="line-clamp-3 block font-serif text-[16px] font-medium leading-snug text-foreground group-hover:text-accent">{stripHtml(post.title.rendered)}</span>
                                                            <span className={`mt-1 block text-[9px] text-muted ${MONO}`}>{dataRelativa(post.date, 'pt')}</span>
                                                        </span>
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <VerTodos href="/comidas" cor={COR_COMIDA}>Ver todos os pratos →</VerTodos>
                    </section>
                )}

                {marcas.length > 0 && (
                    <section aria-label="Marcas de comida e bebida" className="space-y-5">
                        <Capitulo n={++n} id="marcas" titulo="Marcas" sub={`${ec.total} empresas de comida e bebida`} cor={COR_COMIDA} />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {marcas.map(f => <Ficha key={f.slug} ficha={f} base="/empresas" cor={COR_COMIDA} />)}
                        </div>
                        <VerTodos href="/empresas" cor={COR_COMIDA}>Ver todas as empresas →</VerTodos>
                    </section>
                )}

                {produtos.length > 0 && (
                    <section aria-label="Na loja" className="border-2 border-[#ff246e] bg-[#fff0f5] p-4 dark:bg-[#2a1018]">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <p className={`text-[10px] text-muted ${MONO}`}>Na loja · comida coreana · afiliado</p>
                            <Link href="/loja" className="shrink-0 px-3 py-2 font-mono text-[10px] font-black uppercase leading-none tracking-[0.1em] text-white" style={{ backgroundColor: COR_LOJA }}>Ver a loja →</Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                            {produtos.map(p => <StoreCard key={p.id} product={p} compact contexto="hub_cultura" />)}
                        </div>
                    </section>
                )}
            </div>
        </>
    )
}

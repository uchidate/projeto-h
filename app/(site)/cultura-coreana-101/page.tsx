import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { StoreCard } from '@/components/ui/StoreCard'
import { HubBusca, type ItemBusca } from '@/components/cultura/HubBusca'
import { todasReceitas } from '@/lib/receitas'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { JsonLd } from '@/components/seo/JsonLd'
import { ADSENSE } from '@/lib/config/ads'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { escolherFichas, type FichaDoTema } from '@/lib/home/temas'
import { dataRelativa } from '@/lib/home/data-relativa'
import { getCompanies } from '@/lib/wordpress/companies'
import { getFoods } from '@/lib/wordpress/foods'
import { getPostBySlug, getPosts } from '@/lib/wordpress/posts'
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
const COR_FESTA = '#0e7490'

type Guia = { label: string; href: string; emoji: string }

const INICIO = ['o-que-e-hallyu-onda-coreana-explicada', 'como-comecar-no-kpop-guia-para-iniciantes']

/** Trilhas de leitura: a lista vem do WordPress sem agrupamento, então o agrupamento é daqui. Guia fora do mapa cai em "Mais guias". */
const TRILHAS: { titulo: string; cor: string; slugs: string[] }[] = [
    { titulo: 'Língua e convivência', cor: '#0e7490', slugs: ['hangeul-guia-basico-fas-brasileiros', 'nomes-coreanos-estrutura-nome-artistico-guia', 'oppa-unnie-hyung-noona-termos-coreanos-guia', 'sistema-idade-coreana-man-nai-guia', 'nunchi-arte-coreana-ler-ambiente-k-drama', 'han-conceito-coreano-tristeza-k-drama', 'etiqueta-mesa-bebida-coreana-hoesik-guia'] },
    { titulo: 'Tradições e dia a dia', cor: '#b4531a', slugs: ['chuseok-seollal-festas-tradicionais-coreanas-explicadas', 'casamento-coreano-tradicional-pyebaek-guia', 'namoro-coreano-100-dias-couple-items-guia', 'comida-coreana-101-banchan-bap-guk-guia', 'loja-conveniencia-coreana-pyeonuijeom-guia', 'noraebang-karaoke-coreano-guia', 'pc-bang-lan-house-coreana-guia', 'uniforme-colegio-coreano-tipos-escola-guia', 'supersticoes-coreanas-guia-numero-4-fan-death-saju', 'tipo-sanguineo-personalidade-coreia-guia', 'cirurgia-plastica-coreia-contexto-cultural-guia'] },
    { titulo: 'K-pop por dentro', cor: '#c61153', slugs: ['idol-vs-artist-diferenca-carreira-kpop', 'posicoes-grupo-kpop-lider-vocal-visual-maknae-guia', 'line-kpop-vocal-dance-maknae-line-guia', 'band-idol-vs-idol-group-diferenca-kpop-guia', 'sm-hybe-yg-jyp-como-as-grandes-agencias-kpop-funcionam', 'daesang-all-kill-comeback-glossario-kpop', 'charts-kpop-melon-circle-chart-hanteo-music-show-guia', 'fandoms-kpop-light-sticks-fan-chants-fansigns', 'servico-militar-obrigatorio-coreia-idols-guia'] },
    { titulo: 'K-drama e mídia', cor: '#6d3fc0', slugs: ['glossario-tropes-kdrama-chaebol-makjang-second-lead', 'sunbae-hoobae-hierarquia-k-drama-escritorio', 'osts-de-k-drama-as-trilhas-sonoras-que-definiram-geracoes-de-fas', 'bl-gl-genero-boys-love-girls-love-coreano-guia'] },
]

function agruparGuias(guias: Guia[]) {
    const slug = (g: Guia) => g.href.replace('/blog/', '')
    const usados = new Set<string>(INICIO)
    const inicio = INICIO.map(s => guias.find(g => slug(g) === s)).filter((g): g is Guia => !!g)
    const trilhas = TRILHAS.map(t => {
        t.slugs.forEach(s => usados.add(s))
        return { titulo: t.titulo, cor: t.cor, guias: t.slugs.map(s => guias.find(g => slug(g) === s)).filter((g): g is Guia => !!g) }
    })
    const resto = guias.filter(g => !usados.has(slug(g)))
    if (resto.length > 0) trilhas.push({ titulo: 'Mais guias', cor: '#6d3fc0', guias: resto })
    return { inicio, trilhas: trilhas.filter(t => t.guias.length > 0) }
}

const CATEGORIAS_PRATO: [string, string][] = [
    ['rice', 'Arroz'], ['noodles', 'Macarrão'], ['soup_stew', 'Sopas e ensopados'], ['bbq', 'Churrasco'], ['pancake', 'Panquecas'],
    ['street_food', 'Comida de rua'], ['banchan', 'Acompanhamentos'], ['dessert', 'Sobremesas'], ['drink', 'Bebidas'], ['snack', 'Lanches'],
]

const FESTAS: { nome: string; hangul: string; data: string; nota: string; guia?: string }[] = [
    { nome: 'Seollal', hangul: '설날', data: '2027-02-07', nota: 'Ano-Novo lunar', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Daeboreum', hangul: '정월대보름', data: '2027-02-21', nota: 'Primeira lua cheia do ano' },
    { nome: 'Samiljeol', hangul: '삼일절', data: '2027-03-01', nota: 'Movimento de 1º de março' },
    { nome: 'Dano', hangul: '단오', data: '2027-06-09', nota: '5º dia do 5º mês lunar' },
    { nome: 'Gwangbokjeol', hangul: '광복절', data: '2027-08-15', nota: 'Dia da Libertação' },
    { nome: 'Chuseok', hangul: '추석', data: '2027-09-15', nota: 'Festa da colheita', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Hangeul-nal', hangul: '한글날', data: '2027-10-09', nota: 'Dia do alfabeto coreano', guia: '/blog/hangeul-guia-basico-fas-brasileiros' },
]

/** Datas lunares (Seollal, Daeboreum, Dano, Chuseok) conferidas no calendário oficial de 2027; ao virar o ano a lista esvazia e o bloco some até ser atualizada. */
function proximasFestas(agora = new Date()) {
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
    return FESTAS
        .map(f => ({ ...f, dias: Math.round((Date.parse(f.data) - hoje) / 86_400_000) }))
        .filter(f => f.dias >= 0)
        .slice(0, 4)
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function minutosEmTexto(min: number) {
    if (min >= 60) return `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`
    return `${min} min`
}

/** Pratos com modo de preparo cadastrado (data/receitas.json) que existem no acervo, com foto. Tempo longo demais (marinada, molho) não vira rótulo. */
function escolherReceitas(itens: { slug: string; title: { rendered: string }; featured_image_url?: string | null }[]) {
    const mapa = todasReceitas()
    return itens
        .filter(i => i.featured_image_url && mapa[i.slug])
        .slice(0, 4)
        .map(i => {
            const r = mapa[i.slug]
            const total = (r.preparoMin ?? 0) + (r.cozimentoMin ?? 0)
            return { slug: i.slug, nome: stripHtml(i.title.rendered), imagem: i.featured_image_url as string, tempo: total > 0 && total <= 240 ? minutosEmTexto(total) : null }
        })
}

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

function Ficha({ ficha, base, cor, destaque = false }: { ficha: FichaDoTema; base: string; cor: string; destaque?: boolean }) {
    return (
        <Link href={`${base}/${ficha.slug}`} className={`group flex flex-col border border-border bg-background transition-colors hover:border-foreground ${destaque ? 'col-span-2 row-span-2' : ''}`}>
            <span className={`relative block overflow-hidden bg-white ${destaque ? 'min-h-0 flex-1 aspect-[16/10] sm:aspect-auto' : 'aspect-[16/10]'}`}>
                <Image src={ficha.imagem} alt={ficha.nome} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw" className="object-contain p-2 transition-transform group-hover:scale-[1.03]" />
            </span>
            <span className="block px-3 py-2.5">
                <span className={`block font-bold leading-tight text-foreground group-hover:text-accent ${destaque ? 'font-serif text-[22px] font-medium' : 'text-[14px]'}`}>{ficha.nome}</span>
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
    const [settings, comidas, empresas, artigos, prateleira, ...capasInicio] = await Promise.allSettled([
        getSiteSettings(),
        getFoods({ perPage: 100 }),
        getCompanies({ industry: 'food_beverage', perPage: 100 }),
        getPosts({ tag: 'comida-coreana', perPage: 3, includeContent: false }),
        getVitrinePorTermos([], 'hub_cultura', { limit: 5, temas: ['culinaria'] }),
        ...INICIO.map(slug => getPostBySlug(slug)),
    ])
    const guias = ou<Awaited<ReturnType<typeof getSiteSettings>> | null>(null)(settings)?.cultureGuides ?? []
    const fo = ou<Awaited<ReturnType<typeof getFoods>>>(lista)(comidas)
    const ec = ou<Awaited<ReturnType<typeof getCompanies>>>(lista)(empresas)
    const posts = ou<Awaited<ReturnType<typeof getPosts>>>(lista)(artigos)
    const produtos = ou<Awaited<ReturnType<typeof getVitrinePorTermos>>>([])(prateleira).filter(p => p.acf.affiliate_url).slice(0, 5)
    const { inicio, trilhas } = agruparGuias(guias)
    const capas = new Map<string, string>()
    capasInicio.forEach((r, i) => {
        const post = ou<Awaited<ReturnType<typeof getPostBySlug>>>(null)(r as PromiseSettledResult<Awaited<ReturnType<typeof getPostBySlug>>>)
        const imagem = post && getWPImage(post._embedded, post.featured_image_url)
        if (imagem) capas.set(INICIO[i], imagem.src)
    })
    const pratos = escolherFichas(fo.items, 5)
    const itensBusca: ItemBusca[] = [
        ...guias.map(g => ({ rotulo: g.label, href: g.href, tipo: 'Guia' as const })),
        ...fo.items.map(f => ({ rotulo: stripHtml(f.title.rendered), href: `/comidas/${f.slug}`, tipo: 'Prato' as const })),
        ...ec.items.map(c => ({ rotulo: stripHtml(c.title.rendered), href: `/empresas/${c.slug}`, tipo: 'Marca' as const })),
    ]
    const receitas = escolherReceitas(fo.items)
    const festas = proximasFestas()
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
        festas.length > 0 && { id: 'festas', rotulo: 'Festas', n: festas.length, cor: COR_FESTA },
        pratos.length > 0 && { id: 'pratos', rotulo: 'Pratos', n: fo.total, cor: COR_COMIDA },
        marcas.length > 0 && { id: 'marcas', rotulo: 'Marcas', n: ec.total, cor: COR_COMIDA },
    ].filter(Boolean) as { id: string; rotulo: string; n: number; cor: string }[]

    let n = 0

    return (
        <>
            <JsonLd data={jsonLd} />
            <PageBreadcrumb items={[{ name: 'Cultura e Gastronomia', path: '/cultura-coreana-101' }]} />

            {/* Topo no padrão de /artists: título, busca e atalhos numa faixa só. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        Cultura e Gastronomia<span className="text-accent">.</span>
                    </h1>
                    <HubBusca itens={itensBusca} />
                    {atalhos.length > 0 && (
                        <nav aria-label="Seções desta página" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0">
                            {atalhos.map(a => (
                                <a key={a.id} href={`#${a.id}`} className="touch-target flex h-10 shrink-0 items-center border border-border-strong px-4 text-[14px] font-semibold text-foreground transition-colors hover:border-accent/60">{a.rotulo}</a>
                            ))}
                        </nav>
                    )}
                </div>
                <p className="mt-3 text-[13px] text-muted">{`${guias.length} guias · ${fo.total} pratos · ${ec.total} marcas · do alfabeto ao kimchi, explicado em português`}</p>
            </section>

            <div className="page-wrap space-y-10 py-8">
                {guias.length > 0 && (
                    <section aria-label="Guias de cultura" className="space-y-5">
                        <Capitulo n={++n} id="guias" titulo="Cultura" sub={`${guias.length} guias para entender a Coreia`} cor={COR_CULTURA} />
                        {inicio.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {inicio.map(g => {
                                    const capa = capas.get(g.href.replace('/blog/', ''))
                                    return (
                                        <Link key={g.href} href={g.href} className="group block border-2 transition-colors hover:bg-surface" style={{ borderColor: COR_CULTURA }}>
                                            {capa && (
                                                <span className="relative block aspect-video overflow-hidden sm:aspect-[21/9] bg-surface">
                                                    <Image src={capa} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform group-hover:scale-[1.02]" />
                                                </span>
                                            )}
                                            <span className="flex items-center gap-4 px-5 py-4">
                                                <span className="shrink-0 text-[36px] leading-none" aria-hidden="true">{g.emoji}</span>
                                                <span className="min-w-0">
                                                    <span className={`block text-[9px] ${MONO}`} style={{ color: COR_CULTURA }}>Comece por aqui</span>
                                                    <span className="block font-serif text-[22px] font-medium leading-tight text-foreground group-hover:text-accent">{g.label}</span>
                                                </span>
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                            {trilhas.map(t => {
                                const visiveis = t.guias.slice(0, 5)
                                const demais = t.guias.slice(5)
                                const item = (g: Guia) => (
                                    <li key={g.href} className="border-t border-border first:border-t-0">
                                        <Link href={g.href} className="group flex items-center gap-2.5 py-2.5">
                                            <span className="w-6 shrink-0 text-center text-[18px] leading-none" aria-hidden="true">{g.emoji}</span>
                                            <span className="text-[14px] font-semibold leading-snug text-foreground group-hover:text-accent">{g.label}</span>
                                        </Link>
                                    </li>
                                )
                                return (
                                    <div key={t.titulo} className="border-t-4 pt-3" style={{ borderColor: t.cor }}>
                                        <h3 className="mb-1 flex items-baseline justify-between gap-2 font-serif text-[20px] font-medium leading-tight text-foreground">
                                            {t.titulo}
                                            <span className={`text-[9px] text-muted ${MONO}`}>{t.guias.length}</span>
                                        </h3>
                                        <ul>{visiveis.map(item)}</ul>
                                        {demais.length > 0 && (
                                            <details className="group/mais">
                                                <summary className={`cursor-pointer border-t border-border py-2.5 text-[10px] text-muted hover:text-foreground ${MONO}`}>
                                                    <span className="group-open/mais:hidden">+ {demais.length} guias</span>
                                                    <span className="hidden group-open/mais:inline">Mostrar menos</span>
                                                </summary>
                                                <ul>{demais.map(item)}</ul>
                                            </details>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <VerTodos href="/guias" cor={COR_CULTURA}>Ver todos os guias →</VerTodos>
                    </section>
                )}

                {ADSENSE.slots.inline && guias.length > 0 && (
                    <div className="empty:hidden">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="cultura_101" />
                    </div>
                )}

                {festas.length > 0 && (
                    <section aria-label="Próximas festas" className="space-y-5">
                        <Capitulo n={++n} id="festas" titulo="Calendário" sub="Próximas datas da Coreia" cor={COR_FESTA} />
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {festas.map(f => {
                                const corpo = (
                                    <>
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="font-serif text-[22px] font-medium leading-none text-foreground">{f.nome}</span>
                                            <span className="text-[15px] leading-none text-muted" lang="ko">{f.hangul}</span>
                                        </span>
                                        <span className="mt-3 block font-mono text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: COR_FESTA }}>
                                            {f.dias === 0 ? 'Hoje' : f.dias === 1 ? 'Amanhã' : `Em ${f.dias} dias`}
                                        </span>
                                        <span className="mt-1 block text-[13px] text-foreground/70">{formatoData.format(Date.parse(f.data))} · {f.nota}</span>
                                    </>
                                )
                                const cls = 'block h-full border border-border border-t-4 bg-background p-4'
                                return (
                                    <li key={f.nome}>
                                        {f.guia
                                            ? <Link href={f.guia} className={`${cls} transition-colors hover:bg-surface`} style={{ borderTopColor: COR_FESTA }}>{corpo}</Link>
                                            : <div className={cls} style={{ borderTopColor: COR_FESTA }}>{corpo}</div>}
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )}

                {(pratos.length > 0 || posts.items.length > 0) && (
                    <section aria-label="Gastronomia" className="space-y-5">
                        <Capitulo n={++n} id="pratos" titulo="Gastronomia" sub={`${fo.total} pratos catalogados`} cor={COR_COMIDA} />
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {pratos.length > 0 && (
                                <div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {pratos.map((f, i) => <Ficha key={f.slug} ficha={f} base="/comidas" cor={COR_COMIDA} destaque={i === 0} />)}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className={`mr-1 text-[9px] text-muted ${MONO}`}>Explorar por tipo</span>
                                        {CATEGORIAS_PRATO.map(([chave, rotulo]) => (
                                            <Link key={chave} href={`/comidas?category=${chave}`} className="border border-border px-2.5 py-1.5 text-[13px] font-semibold leading-none text-foreground transition-colors hover:border-foreground hover:bg-surface">{rotulo}</Link>
                                        ))}
                                    </div>
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
                        {receitas.length > 0 && (
                            <div className="border-t border-border pt-5">
                                <p className={`mb-3 text-[9px] ${MONO}`} style={{ color: COR_COMIDA }}>Para fazer em casa · com modo de preparo</p>
                                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {receitas.map(r => (
                                        <li key={r.slug}>
                                            <Link href={`/comidas/${r.slug}`} className="group flex items-center gap-3 border border-border bg-background p-2.5 transition-colors hover:border-foreground">
                                                <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-surface">
                                                    <Image src={r.imagem} alt="" fill sizes="56px" className="object-cover" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-[14px] font-bold leading-tight text-foreground group-hover:text-accent">{r.nome}</span>
                                                    {r.tempo && <span className={`mt-1 block text-[9px] text-muted ${MONO}`}>{r.tempo}</span>}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <VerTodos href="/comidas" cor={COR_COMIDA}>Ver todos os pratos →</VerTodos>
                    </section>
                )}

                {marcas.length > 0 && (
                    <section aria-label="Marcas de comida e bebida" className="space-y-5">
                        <Capitulo n={++n} id="marcas" titulo="Marcas" sub={`${ec.total} empresas de comida e bebida`} cor={COR_COMIDA} />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
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
                        <div className="-mx-4 grid auto-cols-[62%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
                            {produtos.map(p => <StoreCard key={p.id} product={p} compact contexto="hub_cultura" />)}
                        </div>
                    </section>
                )}
            </div>
        </>
    )
}

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { HubBusca, type ItemBusca } from '@/components/cultura/HubBusca'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { JsonLd } from '@/components/seo/JsonLd'
import { ADSENSE } from '@/lib/config/ads'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { dataRelativa } from '@/lib/home/data-relativa'
import { getCategories, getPostBySlug, getPosts } from '@/lib/wordpress/posts'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { getWPImage, stripHtml } from '@/lib/utils'
import { metaDescription } from '@/lib/seo/metaDescription'

const PAGE_URL = `${SITE_URL}/cultura-coreana-101`
const TITLE = 'Cultura Coreana: Guias, Festas e Tradições'
const DESCRIPTION = 'Hangeul, honoríficos, festas tradicionais, etiqueta e vida cotidiana: o essencial da cultura coreana reunido num lugar só, com guias para quem está começando.'

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
const COR_MERCH = '#7c3aed'
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

const FESTAS: { nome: string; hangul: string; data: string; nota: string; guia?: string }[] = [
    { nome: 'Seollal', hangul: '설날', data: '2027-02-07', nota: 'Ano-Novo lunar', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Daeboreum', hangul: '정월대보름', data: '2027-02-21', nota: 'Primeira lua cheia do ano' },
    { nome: 'Samiljeol', hangul: '삼일절', data: '2027-03-01', nota: 'Movimento de 1º de março' },
    { nome: 'Dano', hangul: '단오', data: '2027-06-09', nota: '5º dia do 5º mês lunar' },
    { nome: 'Gwangbokjeol', hangul: '광복절', data: '2027-08-15', nota: 'Dia da Libertação' },
    { nome: 'Chuseok', hangul: '추석', data: '2027-09-15', nota: 'Festa da colheita', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Hangeul-nal', hangul: '한글날', data: '2027-10-09', nota: 'Dia do alfabeto coreano', guia: '/blog/hangeul-guia-basico-fas-brasileiros' },
    { nome: 'Seollal', hangul: '설날', data: '2028-01-26', nota: 'Ano-Novo lunar', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Samiljeol', hangul: '삼일절', data: '2028-03-01', nota: 'Movimento de 1º de março' },
    { nome: 'Gwangbokjeol', hangul: '광복절', data: '2028-08-15', nota: 'Dia da Libertação' },
    { nome: 'Hangeul-nal', hangul: '한글날', data: '2028-10-09', nota: 'Dia do alfabeto coreano', guia: '/blog/hangeul-guia-basico-fas-brasileiros' },
]

/** Datas lunares de 2027 (Seollal, Daeboreum, Dano, Chuseok) conferidas no calendário oficial e o Seollal de 2028 em duas fontes; as demais de 2028 são datas fixas. Chuseok, Daeboreum e Dano de 2028 ficam de fora até haver fonte. Ao esgotar a lista, o bloco some até ser atualizada. */
function proximasFestas(agora = new Date()) {
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
    return FESTAS
        .map(f => ({ ...f, dias: Math.round((Date.parse(f.data) - hoje) / 86_400_000) }))
        .filter(f => f.dias >= 0)
        .slice(0, 4)
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

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

function VerTodos({ href, children, cor }: { href: string; children: React.ReactNode; cor: string }) {
    return (
        <Link href={href} className={`inline-block border-b-2 pb-0.5 text-foreground ${MONO}`} style={{ borderColor: cor }}>{children}</Link>
    )
}

export default async function CulturaCoreanaPage() {
    const [settings, culturaPosts, categorias, ...capasInicio] = await Promise.allSettled([
        getSiteSettings(),
        // Margem larga: guias e posts de outros temas ocupam o topo da categoria, e as reportagens vêm depois deles.
        getPosts({ category: 'cultura', perPage: 40, includeContent: false }),
        getCategories(),
        ...INICIO.map(slug => getPostBySlug(slug)),
    ])
    const guias = ou<Awaited<ReturnType<typeof getSiteSettings>> | null>(null)(settings)?.cultureGuides ?? []
    const { inicio, trilhas } = agruparGuias(guias)
    const slugsGuias = new Set(guias.map(g => g.href.replace('/blog/', '')))
    // "Cultura" no WordPress é a categoria mais ampla: o que tem categoria própria (comida, K-beauty, merch) fica no tema dele.
    const idsDeOutroTema = new Set(ou<Awaited<ReturnType<typeof getCategories>>>([])(categorias).filter(c => c.slug === 'comida' || c.slug === 'k-beauty' || c.slug === 'merch').map(c => c.id))
    const reportagens = ou<Awaited<ReturnType<typeof getPosts>>>(lista)(culturaPosts).items
        .filter(p => !slugsGuias.has(p.slug) && !p.categories?.some(id => idsDeOutroTema.has(id)) && getWPImage(p._embedded, p.featured_image_url))
        .slice(0, 4)
    const capas = new Map<string, string>()
    const resumos = new Map<string, string>()
    capasInicio.forEach((r, i) => {
        const post = ou<Awaited<ReturnType<typeof getPostBySlug>>>(null)(r as PromiseSettledResult<Awaited<ReturnType<typeof getPostBySlug>>>)
        const imagem = post && getWPImage(post._embedded, post.featured_image_url)
        if (imagem) capas.set(INICIO[i], imagem.src)
        const resumo = post && (post.acf?.subtitle?.trim() || stripHtml(post.excerpt.rendered))
        if (resumo) resumos.set(INICIO[i], metaDescription(resumo, 150))
    })
    const itensBusca: ItemBusca[] = [
        ...guias.map(g => ({ rotulo: g.label, href: g.href, tipo: 'Guia' as const })),
    ]
    const festas = proximasFestas()

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
    ].filter(Boolean) as { id: string; rotulo: string; n: number; cor: string }[]

    let n = 0

    return (
        <>
            <JsonLd data={jsonLd} />
            <PageBreadcrumb items={[{ name: 'Cultura', path: '/cultura-coreana-101' }]} />

            {/* Topo no padrão de /artists: título, busca e atalhos numa faixa só. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        Cultura<span className="text-accent">.</span>
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
                <p className="mt-3 text-[13px] text-muted">{`${guias.length} guias · do alfabeto às festas, explicado em português`}</p>
            </section>

            <div className="page-wrap space-y-10 py-8">
                {guias.length > 0 && (
                    <section aria-label="Guias de cultura" className="space-y-5">
                        <Capitulo n={++n} id="guias" titulo="Cultura" sub={`${guias.length} guias para entender a Coreia`} cor={COR_CULTURA} />
                        {inicio.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {inicio.map(g => {
                                    const capa = capas.get(g.href.replace('/blog/', ''))
                                    const resumo = resumos.get(g.href.replace('/blog/', ''))
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
                                                    {resumo && <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-foreground/70">{resumo}</span>}
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
                        {reportagens.length > 0 && (
                            <div className="border-t border-border pt-5">
                                <p className={`mb-3 text-[9px] ${MONO}`} style={{ color: COR_CULTURA }}>Reportagens e análises</p>
                                <ul className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                                    {reportagens.map(post => {
                                        const imagem = getWPImage(post._embedded, post.featured_image_url)
                                        return (
                                            <li key={post.id}>
                                                <Link href={`/blog/${post.slug}`} className="group block">
                                                    <span className="relative block aspect-video overflow-hidden bg-surface">
                                                        {imagem && <Image src={imagem.src} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.03]" />}
                                                    </span>
                                                    <span className="mt-2 line-clamp-3 block font-serif text-[17px] font-medium leading-snug text-foreground group-hover:text-accent">{stripHtml(post.title.rendered)}</span>
                                                    <span className={`mt-1 block text-[9px] text-muted ${MONO}`}>{dataRelativa(post.date, 'pt')}</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <VerTodos href="/guias" cor={COR_CULTURA}>Ver todos os guias →</VerTodos>
                            <VerTodos href="/blog?category=cultura" cor={COR_CULTURA}>Mais reportagens de cultura →</VerTodos>
                        </div>
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
                        <ul className="-mx-4 grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
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

                <section aria-label="Outros temas" className="grid gap-4 md:grid-cols-2">
                    <Link href="/comidas" className="group flex items-center gap-4 border-2 px-5 py-4 transition-colors hover:bg-surface" style={{ borderColor: COR_COMIDA }}>
                        <span className="shrink-0 text-[36px] leading-none" aria-hidden="true">🍜</span>
                        <span className="min-w-0">
                            <span className={`block text-[9px] ${MONO}`} style={{ color: COR_COMIDA }}>Gastronomia</span>
                            <span className="block font-serif text-[20px] font-medium leading-tight text-foreground group-hover:text-accent">Pratos, receitas, marcas e a loja de comida coreana</span>
                            <span className={`mt-2 block text-foreground ${MONO}`}>Ver gastronomia →</span>
                        </span>
                    </Link>
                    <Link href="/merch" className="group flex items-center gap-4 border-2 px-5 py-4 transition-colors hover:bg-surface" style={{ borderColor: COR_MERCH }}>
                        <span className="shrink-0 text-[36px] leading-none" aria-hidden="true">🪄</span>
                        <span className="min-w-0">
                            <span className={`block text-[9px] ${MONO}`} style={{ color: COR_MERCH }}>Merch</span>
                            <span className="block font-serif text-[20px] font-medium leading-tight text-foreground group-hover:text-accent">Lightstick, photocard, álbum físico e o que comprar</span>
                            <span className={`mt-2 block text-foreground ${MONO}`}>Ver merch →</span>
                        </span>
                    </Link>
                </section>
            </div>
        </>
    )
}

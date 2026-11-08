import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
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
import type { WPPost } from '@/lib/wordpress/types'
import { metaDescription } from '@/lib/seo/metaDescription'
import { formatDate, htmlLang } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { buildAlternatesAtivos } from '@/lib/i18n/alternates'
import { href } from '@/lib/i18n/routes'
import trilhasData from '@/lib/cultura/trilhas.json'
import { postsTraduzidosPorSlugPt } from '@/lib/cultura/guias-traduzidos'
import { slugPublicoDoPost } from '@/lib/blog/translations'

/** Metadados da página no idioma; o canonical e o hreflang usam a URL de cada idioma. */
export async function buildCulturaMetadata(locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'entity.cultura101' })
    const url = `${SITE_URL}${href('cultura101', undefined, locale)}`
    return {
        title: t('title'),
        description: t('description'),
        alternates: buildAlternatesAtivos('cultura101', undefined, locale),
        openGraph: { ...baseOG(url), title: t('title'), description: t('description') },
        twitter: { ...baseTwitter(), title: t('title'), description: t('description') },
    }
}

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'
const COR_CULTURA = '#6d3fc0'
const COR_COMIDA = '#b4531a'
const COR_MERCH = '#7c3aed'
const COR_FESTA = '#0e7490'

type Guia = { label: string; href: string; emoji: string }

const INICIO: string[] = trilhasData.inicio

/** Trilhas de leitura: a lista vem do WordPress sem agrupamento, então o agrupamento é de `lib/cultura/trilhas.json` (dado, não código). Guia fora do mapa cai em "Mais guias". */
const TRILHAS = trilhasData.trilhas as { id: 'language' | 'traditions' | 'kpop' | 'drama'; cor: string; slugs: string[] }[]

function agruparGuias(guias: Guia[]) {
    const slug = (g: Guia) => g.href.replace('/blog/', '')
    const usados = new Set<string>(INICIO)
    const inicio = INICIO.map(s => guias.find(g => slug(g) === s)).filter((g): g is Guia => !!g)
    const trilhas = TRILHAS.map(t => {
        t.slugs.forEach(s => usados.add(s))
        return { id: t.id as string, cor: t.cor, guias: t.slugs.map(s => guias.find(g => slug(g) === s)).filter((g): g is Guia => !!g) }
    })
    const resto = guias.filter(g => !usados.has(slug(g)))
    if (resto.length > 0) trilhas.push({ id: 'more', cor: '#6d3fc0', guias: resto })
    return { inicio, trilhas: trilhas.filter(t => t.guias.length > 0) }
}

type NotaFesta = 'lunarNewYear' | 'firstFullMoon' | 'march1' | 'dano' | 'liberation' | 'harvest' | 'hangeulDay'

const FESTAS: { nome: string; hangul: string; data: string; nota: NotaFesta; guia?: string }[] = [
    { nome: 'Seollal', hangul: '설날', data: '2027-02-07', nota: 'lunarNewYear', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Daeboreum', hangul: '정월대보름', data: '2027-02-21', nota: 'firstFullMoon' },
    { nome: 'Samiljeol', hangul: '삼일절', data: '2027-03-01', nota: 'march1' },
    { nome: 'Dano', hangul: '단오', data: '2027-06-09', nota: 'dano' },
    { nome: 'Gwangbokjeol', hangul: '광복절', data: '2027-08-15', nota: 'liberation' },
    { nome: 'Chuseok', hangul: '추석', data: '2027-09-15', nota: 'harvest', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Hangeul-nal', hangul: '한글날', data: '2027-10-09', nota: 'hangeulDay', guia: '/blog/hangeul-guia-basico-fas-brasileiros' },
    { nome: 'Seollal', hangul: '설날', data: '2028-01-26', nota: 'lunarNewYear', guia: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas' },
    { nome: 'Samiljeol', hangul: '삼일절', data: '2028-03-01', nota: 'march1' },
    { nome: 'Gwangbokjeol', hangul: '광복절', data: '2028-08-15', nota: 'liberation' },
    { nome: 'Hangeul-nal', hangul: '한글날', data: '2028-10-09', nota: 'hangeulDay', guia: '/blog/hangeul-guia-basico-fas-brasileiros' },
]

/** Datas lunares de 2027 (Seollal, Daeboreum, Dano, Chuseok) conferidas no calendário oficial e o Seollal de 2028 em duas fontes; as demais de 2028 são datas fixas. Chuseok, Daeboreum e Dano de 2028 ficam de fora até haver fonte. Ao esgotar a lista, o bloco some até ser atualizada. */
function proximasFestas(agora = new Date()) {
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
    return FESTAS
        .map(f => ({ ...f, dias: Math.round((Date.parse(f.data) - hoje) / 86_400_000) }))
        .filter(f => f.dias >= 0)
        .slice(0, 4)
}

const formatoData = (data: number, locale: Locale) => formatDate(data, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }, locale)

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

export default async function CulturaCoreanaPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'entity.cultura101' })
    const emPt = locale === DEFAULT_LOCALE
    const [settings, culturaPosts, categorias, ...resto] = await Promise.allSettled([
        getSiteSettings(),
        // Margem larga: guias e posts de outros temas ocupam o topo da categoria, e as reportagens vêm depois deles.
        getPosts({ category: 'cultura', perPage: 40, includeContent: false, lang: emPt ? undefined : locale }),
        getCategories(),
        // Em outro idioma as capas e resumos vêm dos posts traduzidos, não dos originais.
        ...INICIO.map(slug => (emPt ? getPostBySlug(slug) : Promise.resolve(null))),
        postsTraduzidosPorSlugPt(locale, [...INICIO, ...TRILHAS.flatMap(t => t.slugs)]),
    ])
    const capasInicio = resto.slice(0, INICIO.length)
    const traduzidos = ou<Map<string, WPPost>>(new Map())(resto[INICIO.length] as PromiseSettledResult<Map<string, WPPost>>)
    const slugDoGuia = (g: Guia) => g.href.replace('/blog/', '')
    const guiasPt = ou<Awaited<ReturnType<typeof getSiteSettings>> | null>(null)(settings)?.cultureGuides ?? []
    // Em outro idioma só entra guia com tradução publicada, com o título da versão traduzida; o link segue o slug do original.
    const guias: Guia[] = emPt ? guiasPt : guiasPt.flatMap(g => {
        const post = traduzidos.get(slugDoGuia(g))
        return post ? [{ ...g, label: stripHtml(post.title.rendered) }] : []
    })
    const { inicio, trilhas } = agruparGuias(guias)
    const slugsGuias = new Set(guias.map(slugDoGuia))
    // "Cultura" no WordPress é a categoria mais ampla: o que tem categoria própria (comida, K-beauty, merch) fica no tema dele.
    const idsDeOutroTema = new Set(ou<Awaited<ReturnType<typeof getCategories>>>([])(categorias).filter(c => c.slug === 'comida' || c.slug === 'k-beauty' || c.slug === 'merch').map(c => c.id))
    const reportagens = ou<Awaited<ReturnType<typeof getPosts>>>(lista)(culturaPosts).items
        .filter(p => !slugsGuias.has(slugPublicoDoPost(p.translations, p.slug)) && !p.categories?.some(id => idsDeOutroTema.has(id)) && getWPImage(p._embedded, p.featured_image_url))
        .slice(0, 4)
    const capas = new Map<string, string>()
    const resumos = new Map<string, string>()
    capasInicio.forEach((r, i) => {
        const post = emPt
            ? ou<Awaited<ReturnType<typeof getPostBySlug>>>(null)(r as PromiseSettledResult<Awaited<ReturnType<typeof getPostBySlug>>>)
            : traduzidos.get(INICIO[i]) ?? null
        const imagem = post && getWPImage(post._embedded, post.featured_image_url)
        if (imagem) capas.set(INICIO[i], imagem.src)
        const resumo = post && (post.acf?.subtitle?.trim() || stripHtml(post.excerpt.rendered))
        if (resumo) resumos.set(INICIO[i], metaDescription(resumo, 120))
    })
    const itensBusca: ItemBusca[] = [
        ...guias.map(g => ({ rotulo: g.label, href: g.href, tipo: t('searchTag') })),
    ]
    const festas = proximasFestas()

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t('title'),
        description: t('description'),
        url: `${SITE_URL}${href('cultura101', undefined, locale)}`,
        inLanguage: htmlLang(locale),
    }

    const atalhos = [
        guias.length > 0 && { id: 'guias', rotulo: t('shortcutGuides'), n: guias.length, cor: COR_CULTURA },
        festas.length > 0 && { id: 'festas', rotulo: t('shortcutFestivals'), n: festas.length, cor: COR_FESTA },
    ].filter(Boolean) as { id: string; rotulo: string; n: number; cor: string }[]

    let n = 0

    return (
        <>
            <JsonLd data={jsonLd} />
            <PageBreadcrumb items={[{ name: t('breadcrumb'), path: href('cultura101', undefined, locale) }]} />

            {/* Topo no padrão de /artists: título, busca e atalhos numa faixa só. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        {t('h1')}<span className="text-accent">.</span>
                    </h1>
                    <HubBusca itens={itensBusca} placeholder={t('searchPlaceholder')} />
                    {atalhos.length > 0 && (
                        <nav aria-label={t('sectionsAria')} className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0">
                            {atalhos.map(a => (
                                <a key={a.id} href={`#${a.id}`} className="touch-target flex h-10 shrink-0 items-center border border-border-strong px-4 text-[14px] font-semibold text-foreground transition-colors hover:border-accent/60">{a.rotulo}</a>
                            ))}
                        </nav>
                    )}
                </div>
                <p className="mt-3 text-[13px] text-muted">{t('count', { count: guias.length })}</p>
            </section>

            <div className="page-wrap space-y-10 py-8">
                {guias.length > 0 && (
                    <section aria-label={t('guidesAria')} className="space-y-5">
                        <Capitulo n={++n} id="guias" titulo={t('chapterTitle')} sub={t('chapterSub', { count: guias.length })} cor={COR_CULTURA} />
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
                                                    <span className={`block text-[10px] ${MONO}`} style={{ color: COR_CULTURA }}>{t('startHere')}</span>
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
                            {trilhas.map(tr => {
                                const visiveis = tr.guias.slice(0, 5)
                                const demais = tr.guias.slice(5)
                                const item = (g: Guia) => (
                                    <li key={g.href} className="border-t border-border first:border-t-0">
                                        <Link href={g.href} className="group flex items-center gap-2.5 py-2.5">
                                            <span className="w-6 shrink-0 text-center text-[18px] leading-none" aria-hidden="true">{g.emoji}</span>
                                            <span className="text-[14px] font-semibold leading-snug text-foreground group-hover:text-accent">{g.label}</span>
                                        </Link>
                                    </li>
                                )
                                return (
                                    <div key={tr.id} className="border-t-4 pt-3" style={{ borderColor: tr.cor }}>
                                        <h3 className="mb-1 flex items-baseline justify-between gap-2 font-serif text-[20px] font-medium leading-tight text-foreground">
                                            {t(`trails.${tr.id as 'language'}`)}
                                            <span className={`text-[10px] text-muted ${MONO}`}>{tr.guias.length}</span>
                                        </h3>
                                        <ul>{visiveis.map(item)}</ul>
                                        {demais.length > 0 && (
                                            <details className="group/mais">
                                                <summary className={`cursor-pointer border-t border-border py-2.5 text-[10px] text-muted hover:text-foreground ${MONO}`}>
                                                    <span className="group-open/mais:hidden">{t('more', { count: demais.length })}</span>
                                                    <span className="hidden group-open/mais:inline">{t('less')}</span>
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
                                <p className={`mb-3 text-[10px] ${MONO}`} style={{ color: COR_CULTURA }}>{t('reports')}</p>
                                <ul className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                                    {reportagens.map(post => {
                                        const imagem = getWPImage(post._embedded, post.featured_image_url)
                                        return (
                                            <li key={post.id}>
                                                <Link href={`/blog/${slugPublicoDoPost(post.translations, post.slug)}`} className="group block">
                                                    <span className="relative block aspect-video overflow-hidden bg-surface">
                                                        {imagem && <Image src={imagem.src} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.03]" />}
                                                    </span>
                                                    <span className="mt-2 line-clamp-3 block font-serif text-[17px] font-medium leading-snug text-foreground group-hover:text-accent">{stripHtml(post.title.rendered)}</span>
                                                    <span className={`mt-1 block text-[10px] text-muted ${MONO}`}>{dataRelativa(post.date, locale)}</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <VerTodos href="/guias" cor={COR_CULTURA}>{t('seeAllGuides')}</VerTodos>
                            <VerTodos href="/blog?category=cultura" cor={COR_CULTURA}>{t('moreReports')}</VerTodos>
                        </div>
                    </section>
                )}

                {ADSENSE.slots.inline && guias.length > 0 && (
                    <div className="empty:hidden">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="cultura_101" />
                    </div>
                )}

                {festas.length > 0 && (
                    <section aria-label={t('festivalsAria')} className="space-y-5">
                        <Capitulo n={++n} id="festas" titulo={t('festivalsTitle')} sub={t('festivalsSub')} cor={COR_FESTA} />
                        <ul className="-mx-4 grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
                            {festas.map(f => {
                                const corpo = (
                                    <>
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="font-serif text-[22px] font-medium leading-none text-foreground">{f.nome}</span>
                                            <span className="text-[15px] leading-none text-muted" lang="ko">{f.hangul}</span>
                                        </span>
                                        <span className="mt-3 block font-mono text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: COR_FESTA }}>
                                            {f.dias === 0 ? t('today') : f.dias === 1 ? t('tomorrow') : t('inDays', { days: f.dias })}
                                        </span>
                                        <span className="mt-1 block text-[13px] text-foreground/70">{formatoData(Date.parse(f.data), locale)} · {t(`festivals.${f.nota}`)}</span>
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

                <section aria-label={t('othersAria')} className="grid gap-4 md:grid-cols-2">
                    <Link href="/comidas" className="group flex items-center gap-4 border-2 px-5 py-4 transition-colors hover:bg-surface" style={{ borderColor: COR_COMIDA }}>
                        <span className="shrink-0 text-[36px] leading-none" aria-hidden="true">🍜</span>
                        <span className="min-w-0">
                            <span className={`block text-[10px] ${MONO}`} style={{ color: COR_COMIDA }}>{t('foodKicker')}</span>
                            <span className="block font-serif text-[20px] font-medium leading-tight text-foreground group-hover:text-accent">{t('foodTitle')}</span>
                            <span className={`mt-2 block text-foreground ${MONO}`}>{t('foodCta')}</span>
                        </span>
                    </Link>
                    {/* Merch é vitrine da loja brasileira (somentePt no manifesto de rotas): fora do inglês. */}
                    {emPt && (
                    <Link href="/merch" className="group flex items-center gap-4 border-2 px-5 py-4 transition-colors hover:bg-surface" style={{ borderColor: COR_MERCH }}>
                        <span className="shrink-0 text-[36px] leading-none" aria-hidden="true">🪄</span>
                        <span className="min-w-0">
                            <span className={`block text-[10px] ${MONO}`} style={{ color: COR_MERCH }}>Merch</span>
                            <span className="block font-serif text-[20px] font-medium leading-tight text-foreground group-hover:text-accent">{t('merchTitle')}</span>
                            <span className={`mt-2 block text-foreground ${MONO}`}>{t('merchCta')}</span>
                        </span>
                    </Link>
                    )}
                </section>
            </div>
        </>
    )
}

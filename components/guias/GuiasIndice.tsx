import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { Fragment } from 'react'
import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Link from '@/components/i18n/LocalizedLink'
import { ALL_HUBS, GRUPOS_DE_GUIAS, type ArchiveHub } from '@/lib/guias'
import { HomeGuias } from '@/components/home/HomeGuias'
import { HubBusca, type ItemBusca } from '@/components/cultura/HubBusca'
import { VISITAS_POR_GUIA, porDemanda, resumoDoGuia } from '@/lib/guias/demanda'
import { alternativasDoIndice, localizarGuia, slugPublicoDoGuia, slugsPtTraduzidos } from '@/lib/guias/i18n'
import { postsTraduzidosPorSlugPt } from '@/lib/cultura/guias-traduzidos'
import { carregarGuiasPorTema, carregarPassos } from '@/lib/home/guias'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { SITE_URL, compartilhamento } from '@/lib/constants/site'
import { PageBreadcrumb as BreadcrumbSchemaLd } from '@/components/seo/PageBreadcrumb'

export function buildGuiasMetadata(): Metadata {
    return {
        title: 'Guias de K-Drama, K-Pop e Cinema Coreano',
        description: 'Explore guias editoriais sobre produções, artistas e grupos do entretenimento coreano. Doramas por gênero, plataforma, artistas por agência e muito mais.',
        alternates: { canonical: `${SITE_URL}/guias`, languages: alternativasDoIndice() ?? { [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/guias` } },
        ...compartilhamento({
            titulo: 'Guias de K-Drama, K-Pop e Cinema Coreano',
            descricao: 'Doramas por gênero e plataforma, artistas por agência e muito mais.',
            caminho: '/guias',
        }),
    }
}

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

const KIND_ORDER = ['productions', 'artists', 'groups'] as const
type IdGrupo = 'genre' | 'platform' | 'network' | 'year' | 'profile' | 'artistAgency' | 'solo' | 'members' | 'type' | 'groupAgency'
const KIND_COR: Record<string, string> = { productions: '#c61153', artists: '#0e7490', groups: '#6d3fc0' }
const MOSTRAR = 6

const lista = <T,>(fn: () => Promise<T>, vazio: T) => fn().catch(() => vazio)

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

type Rotulos = { mais: (count: number) => string; menos: string }

/** Guia na lista: em outro idioma mostra o texto traduzido e leva à URL do idioma. */
function ItemDoGuia({ hub, locale }: { hub: ArchiveHub; locale: Locale }) {
    const exibido = localizarGuia(hub, locale) ?? hub
    const resumo = resumoDoGuia(exibido.shortTitle, exibido.description)
    return (
        <li className="border-t border-border first:border-t-0">
            <Link href={href('guide', { slug: slugPublicoDoGuia(hub.slug, locale) ?? hub.slug }, locale)} className="group block py-2.5">
                <span className="block text-[14px] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">{exibido.shortTitle}</span>
                {resumo && <span className="mt-0.5 line-clamp-1 block text-[12px] text-muted">{resumo}</span>}
            </Link>
        </li>
    )
}

function GrupoDeGuias({ titulo, hubs, cor, locale, rotulos }: { titulo: string; hubs: ArchiveHub[]; cor: string; locale: Locale; rotulos: Rotulos }) {
    const ordenados = porDemanda(hubs)
    const visiveis = ordenados.slice(0, MOSTRAR)
    const demais = ordenados.slice(MOSTRAR)
    return (
        <div className="border-t-4 pt-3" style={{ borderColor: cor }}>
            <h3 className="mb-1 flex items-baseline justify-between gap-2 font-serif text-[20px] font-medium leading-tight text-foreground">
                {titulo}
                <span className={`text-[10px] text-muted ${MONO}`}>{hubs.length}</span>
            </h3>
            <ul>{visiveis.map(h => <ItemDoGuia key={h.slug} hub={h} locale={locale} />)}</ul>
            {demais.length > 0 && (
                <details className="group/mais">
                    <summary className={`cursor-pointer border-t border-border py-2.5 text-[10px] text-muted hover:text-foreground ${MONO}`}>
                        <span className="group-open/mais:hidden">{rotulos.mais(demais.length)}</span>
                        <span className="hidden group-open/mais:inline">{rotulos.menos}</span>
                    </summary>
                    <ul>{demais.map(h => <ItemDoGuia key={h.slug} hub={h} locale={locale} />)}</ul>
                </details>
            )}
        </div>
    )
}

export async function GuiasIndice({ kind, locale = DEFAULT_LOCALE }: { kind?: string; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'entity.guides.index' })
    const emPt = locale === DEFAULT_LOCALE
    const activeKind = KIND_ORDER.find(k => k === kind) ?? ''
    const visibleKinds = activeKind ? [activeKind] : KIND_ORDER

    // Em outro idioma só existe o guia traduzido; os grupos que ficam vazios somem.
    const traduzidos = new Set(slugsPtTraduzidos(locale))
    const guiaDoIdioma = (h: ArchiveHub) => emPt || traduzidos.has(h.slug)
    const hubsDoIdioma = ALL_HUBS.filter(guiaDoIdioma)
    const gruposDoIdioma = GRUPOS_DE_GUIAS.map(({ kind: k, grupos }) => ({
        kind: k,
        grupos: grupos.map(g => ({ ...g, hubs: g.hubs.filter(guiaDoIdioma) })).filter(g => g.hubs.length > 0),
    }))
    const visibleCount = activeKind ? hubsDoIdioma.filter(h => h.kind === activeKind).length : hubsDoIdioma.length
    const totalByKind = Object.fromEntries(KIND_ORDER.map(k => [k, hubsDoIdioma.filter(h => h.kind === k).length]))
    const rotuloDoTipo = (k: (typeof KIND_ORDER)[number]) => t(`kinds.${k}`)

    // A faixa de entrada (trilha "Comece aqui" e guias por tema, com capas) só aparece sem filtro; some se o WordPress falhar.
    // Fora do português, a trilha usa os posts com versão no idioma e os temas só os guias traduzidos.
    const [settings, guiasPorTema] = activeKind
        ? [null, []]
        : await Promise.all([lista(getSiteSettings, null), lista(() => carregarGuiasPorTema(locale), [])])
    const passosPt = settings?.cultureGuides ?? []
    const guiasDeCultura = emPt ? passosPt : await carregarPassos(passosPt, locale).catch(() => [])
    const totalCultura = emPt ? passosPt.length : (await postsTraduzidosPorSlugPt(locale, passosPt.map(g => g.href.replace('/blog/', '')))).size

    const itensBusca: ItemBusca[] = [
        ...hubsDoIdioma.map(h => {
            const exibido = localizarGuia(h, locale) ?? h
            return { rotulo: exibido.shortTitle, href: href('guide', { slug: slugPublicoDoGuia(h.slug, locale) ?? h.slug }, locale), tipo: rotuloDoTipo(h.kind), palavras: exibido.keywords.join(' ') }
        }),
        ...guiasDeCultura.map(g => ({ rotulo: g.label, href: g.href, tipo: t('cultureTag') })),
    ]

    const maisLidos = porDemanda(hubsDoIdioma).filter(h => VISITAS_POR_GUIA[h.slug]).slice(0, 6)
    const sugestoes: ItemBusca[] = maisLidos.slice(0, 3).map(h => ({
        rotulo: (localizarGuia(h, locale) ?? h).shortTitle,
        href: href('guide', { slug: slugPublicoDoGuia(h.slug, locale) ?? h.slug }, locale),
        tipo: rotuloDoTipo(h.kind),
    }))
    const rotulos: Rotulos = { mais: (count) => t('more', { count }), menos: t('less') }
    const listaUrl = href('guides', undefined, locale)
    const filtros = [{ value: '', label: t('filterAll') }, ...KIND_ORDER.filter(k => totalByKind[k] > 0).map(k => ({ value: k, label: rotuloDoTipo(k) }))]

    let n = 0
    return (
        <>
            <BreadcrumbSchemaLd items={[{ name: t('title'), path: listaUrl }]} />

            {/* Topo no padrão de /artists: título, busca e atalhos numa faixa só. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        {t('title')}<span className="sr-only"> {t('titleSr')}</span><span className="text-accent">.</span>
                    </h1>
                    <HubBusca itens={itensBusca} sugestoes={sugestoes} placeholder={t('searchPlaceholder')} />
                    <nav aria-label={t('categoriesAria')} className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0">
                        {filtros.map(f => {
                            const ativo = f.value === activeKind
                            return (
                                <Link
                                    key={f.value}
                                    href={f.value ? `${listaUrl}?kind=${f.value}` : listaUrl}
                                    aria-current={ativo ? 'page' : undefined}
                                    className={`touch-target flex h-10 shrink-0 items-center border px-4 text-[14px] font-semibold transition-colors ${ativo ? 'border-accent text-accent' : 'border-border-strong text-foreground hover:border-accent/60'}`}
                                >
                                    {f.label}
                                </Link>
                            )
                        })}
                        <Link href="/cultura-coreana-101" className="touch-target flex h-10 shrink-0 items-center border border-border-strong px-4 text-[14px] font-semibold text-foreground transition-colors hover:border-accent/60">{t('culture')} →</Link>
                    </nav>
                </div>
                <p className="mt-3 text-[13px] text-muted">
                    {!activeKind && totalCultura > 0 ? t('countWithCulture', { count: visibleCount, culture: totalCultura }) : t('count', { count: visibleCount })}
                </p>
            </section>

            {!activeKind && (
                <nav aria-label={t('sectionsAria')} className="sticky top-0 z-30 border-y border-border bg-background/95 backdrop-blur">
                    <div className="page-wrap flex gap-5 overflow-x-auto py-2.5">
                        {KIND_ORDER.filter(k => totalByKind[k] > 0).map((k, i) => (
                            <a key={k} href={`#${k}`} className={`flex shrink-0 items-center gap-2 text-foreground hover:text-accent ${MONO}`}>
                                <span aria-hidden className="h-2 w-2" style={{ backgroundColor: KIND_COR[k] }} />
                                {`0${i + 1} · ${rotuloDoTipo(k)}`}
                            </a>
                        ))}
                    </div>
                </nav>
            )}

            <div className="page-wrap space-y-10 py-8">
                {!activeKind && (guiasPorTema.length > 0 || guiasDeCultura.length > 0) && (
                    <div data-bloco="guias-entrada" className="-mx-3.5 lg:mx-0">
                        <HomeGuias passos={guiasDeCultura} guias={guiasPorTema} locale={locale} naIndice />
                    </div>
                )}

                {visibleKinds.map((k, indiceSecao) => {
                    const grupos = gruposDoIdioma.find(g => g.kind === k)?.grupos ?? []
                    if (!grupos.length) return null
                    const cor = KIND_COR[k]
                    return (
                        <Fragment key={k}>
                            {/* Entre seções: a página é longa e não tinha anúncio nenhum (medido em 2026-09-17). */}
                            {indiceSecao > 0 && ADSENSE.slots.inline && (
                                <div className="empty:hidden">
                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="guias_lista" />
                                </div>
                            )}
                            <section aria-label={rotuloDoTipo(k)} className="space-y-5">
                                <Capitulo n={++n} id={k} titulo={rotuloDoTipo(k)} sub={t('chapterSub', { count: totalByKind[k], sub: t(`kindSub.${k}`) })} cor={cor} />
                                <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                                    {grupos.map(g => <GrupoDeGuias key={g.id} titulo={t(`groups.${g.id as IdGrupo}`)} hubs={g.hubs} cor={cor} locale={locale} rotulos={rotulos} />)}
                                    {/* Grupos tem só duas colunas de guias; o espaço sobrando vira o atalho para o que mais se lê. */}
                                    {k === 'groups' && !activeKind && maisLidos.length > 0 && <GrupoDeGuias titulo={t('mostRead')} hubs={maisLidos} cor={cor} locale={locale} rotulos={rotulos} />}
                                </div>
                            </section>
                        </Fragment>
                    )
                })}

                {!activeKind && (
                    <Link
                        href="/cultura-coreana-101"
                        className="group flex flex-col gap-1 border-2 border-[#6d3fc0] bg-background px-5 py-5 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                    >
                        <span>
                            <span className={`block text-[10px] text-[#6d3fc0] ${MONO}`}>{t('alsoIn')}</span>
                            <span className="block font-serif text-[24px] font-medium leading-tight text-foreground group-hover:text-accent">{t('cultureTitle')}</span>
                            <span className="mt-1 block text-[14px] text-foreground/70">{t('cultureText', { count: totalCultura || t('cultureMany') })}</span>
                        </span>
                        <span className={`shrink-0 text-foreground ${MONO}`}>{t('open')} →</span>
                    </Link>
                )}
            </div>
        </>
    )
}

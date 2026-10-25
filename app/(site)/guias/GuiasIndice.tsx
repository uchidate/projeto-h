import { Fragment } from 'react'
import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Link from 'next/link'
import { ALL_HUBS, GRUPOS_DE_GUIAS, type ArchiveHub } from '@/lib/guias'
import { HomeGuias } from '@/components/home/HomeGuias'
import { HubBusca, type ItemBusca } from '@/components/cultura/HubBusca'
import { porDemanda, resumoDoGuia } from '@/lib/guias/demanda'
import { carregarGuiasPorTema } from '@/lib/home/guias'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { SITE_URL, compartilhamento } from '@/lib/constants/site'
import { PageBreadcrumb as BreadcrumbSchemaLd } from '@/components/seo/PageBreadcrumb'

export function buildGuiasMetadata(): Metadata {
    return {
        title: 'Guias de K-Drama, K-Pop e Cinema Coreano',
        description: 'Explore guias editoriais sobre produções, artistas e grupos do entretenimento coreano. Doramas por gênero, plataforma, artistas por agência e muito mais.',
        alternates: { canonical: `${SITE_URL}/guias` },
        ...compartilhamento({
            titulo: 'Guias de K-Drama, K-Pop e Cinema Coreano',
            descricao: 'Doramas por gênero e plataforma, artistas por agência e muito mais.',
            caminho: '/guias',
        }),
    }
}

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

const KIND_ORDER = ['productions', 'artists', 'groups'] as const
const KIND_LABELS: Record<string, string> = { productions: 'Produções', artists: 'Artistas', groups: 'Grupos' }
const KIND_SUB: Record<string, string> = {
    productions: 'Doramas, filmes e séries por gênero, plataforma, emissora e ano',
    artists: 'Atores e cantores por perfil, agência e grupo de origem',
    groups: 'Girl groups, boy groups e as agências por trás deles',
}
const KIND_COR: Record<string, string> = { productions: '#c61153', artists: '#0e7490', groups: '#6d3fc0' }
const MOSTRAR = 6

const FILTROS = [
    { value: '', label: 'Todos' },
    { value: 'productions', label: 'Produções' },
    { value: 'artists', label: 'Artistas' },
    { value: 'groups', label: 'Grupos' },
]

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

function ItemDoGuia({ hub }: { hub: ArchiveHub }) {
    const resumo = resumoDoGuia(hub.shortTitle, hub.description)
    return (
        <li className="border-t border-border first:border-t-0">
            <Link href={`/guias/${hub.slug}`} className="group block py-2.5">
                <span className="block text-[14px] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">{hub.shortTitle}</span>
                {resumo && <span className="mt-0.5 line-clamp-1 block text-[12px] text-muted">{resumo}</span>}
            </Link>
        </li>
    )
}

function GrupoDeGuias({ titulo, hubs, cor }: { titulo: string; hubs: ArchiveHub[]; cor: string }) {
    const ordenados = porDemanda(hubs)
    const visiveis = ordenados.slice(0, MOSTRAR)
    const demais = ordenados.slice(MOSTRAR)
    return (
        <div className="border-t-4 pt-3" style={{ borderColor: cor }}>
            <h3 className="mb-1 flex items-baseline justify-between gap-2 font-serif text-[20px] font-medium leading-tight text-foreground">
                {titulo}
                <span className={`text-[9px] text-muted ${MONO}`}>{hubs.length}</span>
            </h3>
            <ul>{visiveis.map(h => <ItemDoGuia key={h.slug} hub={h} />)}</ul>
            {demais.length > 0 && (
                <details className="group/mais">
                    <summary className={`cursor-pointer border-t border-border py-2.5 text-[10px] text-muted hover:text-foreground ${MONO}`}>
                        <span className="group-open/mais:hidden">+ {demais.length} guias</span>
                        <span className="hidden group-open/mais:inline">Mostrar menos</span>
                    </summary>
                    <ul>{demais.map(h => <ItemDoGuia key={h.slug} hub={h} />)}</ul>
                </details>
            )}
        </div>
    )
}

export async function GuiasIndice({ kind }: { kind?: string }) {
    const activeKind = KIND_ORDER.find(k => k === kind) ?? ''
    const visibleKinds = activeKind ? [activeKind] : KIND_ORDER
    const visibleCount = activeKind ? ALL_HUBS.filter(h => h.kind === activeKind).length : ALL_HUBS.length
    const totalByKind = Object.fromEntries(KIND_ORDER.map(k => [k, ALL_HUBS.filter(h => h.kind === k).length]))

    // A faixa de entrada (trilha "Comece aqui" e guias por tema, com capas) só aparece sem filtro e some se o WordPress falhar.
    const [settings, guiasPorTema] = activeKind
        ? [null, []]
        : await Promise.all([lista(getSiteSettings, null), lista(carregarGuiasPorTema, [])])
    const guiasDeCultura = settings?.cultureGuides ?? []

    const itensBusca: ItemBusca[] = [
        ...ALL_HUBS.map(h => ({ rotulo: h.shortTitle, href: `/guias/${h.slug}`, tipo: KIND_LABELS[h.kind] ?? 'Guia' })),
        ...guiasDeCultura.map(g => ({ rotulo: g.label, href: g.href, tipo: 'Cultura' })),
    ]

    let n = 0
    return (
        <>
            <BreadcrumbSchemaLd items={[{ name: 'Guias', path: '/guias' }]} />

            {/* Topo no padrão de /artists: título, busca e atalhos numa faixa só. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        Guias<span className="sr-only"> de K-Drama, K-Pop e cultura coreana</span><span className="text-accent">.</span>
                    </h1>
                    <HubBusca itens={itensBusca} placeholder="Buscar guia, gênero, plataforma ou agência" />
                    <nav aria-label="Categorias de guias" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0">
                        {FILTROS.map(f => {
                            const ativo = f.value === activeKind
                            return (
                                <Link
                                    key={f.value}
                                    href={f.value ? `/guias?kind=${f.value}` : '/guias'}
                                    aria-current={ativo ? 'page' : undefined}
                                    className={`touch-target flex h-10 shrink-0 items-center border px-4 text-[14px] font-semibold transition-colors ${ativo ? 'border-accent text-accent' : 'border-border-strong text-foreground hover:border-accent/60'}`}
                                >
                                    {f.label}
                                </Link>
                            )
                        })}
                        <Link href="/cultura-coreana-101" className="touch-target flex h-10 shrink-0 items-center border border-border-strong px-4 text-[14px] font-semibold text-foreground transition-colors hover:border-accent/60">Cultura →</Link>
                    </nav>
                </div>
                <p className="mt-3 text-[13px] text-muted">
                    {visibleCount} guias{!activeKind && guiasDeCultura.length > 0 ? ` · ${guiasDeCultura.length} de cultura` : ''} · para descobrir o que assistir, quem acompanhar e por onde começar
                </p>
            </section>

            {!activeKind && (
                <nav aria-label="Seções de guias" className="sticky top-0 z-30 border-y border-border bg-background/95 backdrop-blur">
                    <div className="page-wrap flex gap-5 overflow-x-auto py-2.5">
                        {KIND_ORDER.map((k, i) => (
                            <a key={k} href={`#${k}`} className={`flex shrink-0 items-center gap-2 text-foreground hover:text-accent ${MONO}`}>
                                <span aria-hidden className="h-2 w-2" style={{ backgroundColor: KIND_COR[k] }} />
                                {`0${i + 1} · ${KIND_LABELS[k]}`}
                            </a>
                        ))}
                    </div>
                </nav>
            )}

            <div className="page-wrap space-y-10 py-8">
                {!activeKind && (guiasPorTema.length > 0 || guiasDeCultura.length > 0) && (
                    <div data-bloco="guias-entrada" className="-mx-3.5 lg:mx-0">
                        <HomeGuias passos={guiasDeCultura} guias={guiasPorTema} />
                    </div>
                )}

                {visibleKinds.map((k, indiceSecao) => {
                    const grupos = GRUPOS_DE_GUIAS.find(g => g.kind === k)?.grupos ?? []
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
                            <section aria-label={KIND_LABELS[k]} className="space-y-5">
                                <Capitulo n={++n} id={k} titulo={KIND_LABELS[k]} sub={`${totalByKind[k]} guias · ${KIND_SUB[k]}`} cor={cor} />
                                <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                                    {grupos.map(g => <GrupoDeGuias key={g.titulo} titulo={g.titulo} hubs={g.hubs} cor={cor} />)}
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
                            <span className={`block text-[9px] text-[#6d3fc0] ${MONO}`}>Também nos guias</span>
                            <span className="block font-serif text-[24px] font-medium leading-tight text-foreground group-hover:text-accent">Cultura e gastronomia coreana</span>
                            <span className="mt-1 block text-[14px] text-foreground/70">Hangeul, honoríficos, festas, pratos e marcas: {guiasDeCultura.length || 'dezenas de'} guias para entender a Coreia.</span>
                        </span>
                        <span className={`shrink-0 text-foreground ${MONO}`}>Abrir →</span>
                    </Link>
                )}
            </div>
        </>
    )
}

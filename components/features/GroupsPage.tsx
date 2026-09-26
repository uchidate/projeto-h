import { htmlLang, intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import { BarraAncorada } from '@/components/ui/BarraAncorada'
import { ContinueDeOndeParou } from '@/components/artists/lista/ContinueDeOndeParou'
import Link from 'next/link'
import { Fragment } from 'react'
import { Users } from 'lucide-react'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, getYear, stripHtml } from '@/lib/utils'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { EmptyState } from '@/components/ui/EmptyState'
import { GENERATIONS, getGeneration } from '@/lib/constants/generations'

const TYPE_PT: Record<string, string> = {
    girl_group: 'Girl Group',
    boy_group:  'Boy Group',
    co_ed:      'Co-Ed',
    solo:       'Solo',
}

const TYPE_FILTERS = [
    { value: 'girl_group', label: 'Girl Group' },
    { value: 'boy_group',  label: 'Boy Group'  },
    { value: 'co_ed',      label: 'Co-Ed'      },
]

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function nameToGradient(name: string): string {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    const hue = Math.abs(h) % 360
    return `linear-gradient(135deg, hsl(${hue},55%,16%) 0%, hsl(${(hue + 50) % 360},45%,10%) 100%)`
}

export function GroupCard({ group, priority }: { group: WPGroup; priority?: boolean }) {
    const image = getWPImage(group._embedded, group.featured_image_url)
    const name = stripHtml(group.title.rendered)
    const acf = group.acf ?? {}
    const debutYear = getYear(acf.debut_date)
    const generation = getGeneration(debutYear)
    const memberCount = acf.members?.length ?? 0
    const type = acf.type ? (TYPE_PT[acf.type] ?? acf.type) : ''
    const isInactive = acf.active === false

    return (
        <Link
            href={`/groups/${group.slug}`}
            className="group grid grid-cols-[76px_minmax(0,1fr)] overflow-hidden border border-border/70 bg-background transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-surface/50 sm:block"
            style={{ borderTopColor: acf.color || undefined }}
        >
            <div className="relative aspect-square overflow-hidden bg-surface">
                {image ? (
                    <Image src={image.src} alt={image.alt || name} fill priority={priority}
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 76px, (max-width: 1024px) 33vw, 20vw" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"
                        style={{ background: acf.color ? `linear-gradient(135deg, ${acf.color}33, ${acf.color}11)` : nameToGradient(name) }}>
                        {acf.color ? (
                            <span className="font-black text-[30px] leading-none sm:text-[48px]" style={{ color: acf.color }}>{name[0]}</span>
                        ) : (
                            <Users size={30} className="text-white/15" />
                        )}
                    </div>
                )}
                <div className="absolute inset-0 hidden bg-linear-to-t from-black/75 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block" />
                {isInactive && (
                    <span className="absolute right-1.5 top-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/80 sm:right-2 sm:top-2 sm:text-[9px]">
                        encerrado
                    </span>
                )}
                {!isInactive && (acf.trending_score ?? 0) >= 7 && (
                    <span className="absolute left-1.5 top-1.5 bg-accent-a11y px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white sm:left-2 sm:top-2 sm:text-[9px]">
                        em alta
                    </span>
                )}
                {memberCount > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/75 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-white sm:bottom-2 sm:left-2 sm:text-[9px]">
                        <Users size={10} aria-hidden="true" />
                        {memberCount}
                    </span>
                )}
                <div className="absolute inset-x-3 bottom-3 hidden translate-y-1 font-mono text-[9px] uppercase tracking-[0.06em] text-white/80 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
                    {[acf.name_hangul, debutYear && `desde ${debutYear}`].filter(Boolean).join(' · ')}
                </div>
            </div>
            <div className="flex min-w-0 flex-col justify-center px-3 py-2.5 sm:block sm:min-h-[94px] sm:px-3 sm:py-3">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                        {name}
                    </span>
                    {acf.name_hangul && (
                        <span className="shrink-0 font-mono text-[9px] text-muted sm:hidden">{acf.name_hangul}</span>
                    )}
                </div>
                <div className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.04em] text-muted">
                    {[type, debutYear].filter(Boolean).join(' · ')}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {generation && (
                        <span
                            title={generation.label}
                            className={`border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.04em] ${generation.className}`}
                        >
                            {generation.shortLabel}
                        </span>
                    )}
                    {memberCount > 0 && (
                        <span className="hidden border border-border bg-surface px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.04em] text-muted sm:inline-block">
                            {memberCount} {memberCount === 1 ? 'integrante' : 'integrantes'}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export interface GeracaoResumo { slug: string; label: string; fotos: WPGroup[] }
export interface DebutDoMes { slug: string; nome: string; dia: number; ano: number }

interface Props {
    groups: WPGroup[]
    total: number
    totalPages: number
    currentPage: number
    search?: string
    type?: string
    active?: string
    letter?: string
    generation?: string
    order?: string
    letterCounts: Record<string, number>
    emAlta?: WPGroup[]
    geracoes?: GeracaoResumo[]
    debutaram?: DebutDoMes[]
    mesNome?: string
}

const SERIF = 'font-[family-name:var(--font-playfair)]'
const H2 = `${SERIF} text-[26px] font-semibold leading-tight sm:text-[32px]`
const KICKER = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

const chip = (ativo: boolean) =>
    `touch-target flex h-9 shrink-0 items-center border px-3.5 text-[13px] font-bold transition-colors ${ativo ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-foreground hover:border-accent/60'}`
const aba = (ativo: boolean) =>
    `flex h-11 shrink-0 items-center border-b-2 text-[14px] font-semibold transition-colors ${ativo ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground'}`

/** Card de diretório: foto quadrada, nome e uma linha de meta (tipo · ano). */
function GroupTile({ group, priority }: { group: WPGroup; priority?: boolean }) {
    const image = getWPImage(group._embedded, group.featured_image_url)
    const name = stripHtml(group.title.rendered)
    const acf = group.acf ?? {}
    const meta = [acf.type ? (TYPE_PT[acf.type] ?? acf.type) : '', getYear(acf.debut_date)].filter(Boolean).join(' · ')
    return (
        <Link href={`/groups/${group.slug}`} className="group block">
            <span className="relative block aspect-square overflow-hidden bg-surface">
                {image
                    ? <Image src={image.src} alt={image.alt || name} fill priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
                    : <span className="flex h-full w-full items-center justify-center" style={{ background: nameToGradient(name) }}><Users size={30} className="text-white/20" /></span>}
                {acf.active === false && <span className="absolute right-1.5 top-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/80">encerrado</span>}
            </span>
            <span className="mt-2 block truncate text-[14px] font-bold leading-tight group-hover:text-accent sm:text-[15px]">{name}</span>
            {meta && <span className="mt-0.5 block truncate text-[12px] text-muted">{meta}</span>}
        </Link>
    )
}

export function GroupsPage({ groups, total, totalPages, currentPage, search, type, active, letter, generation, order, letterCounts, emAlta = [], geracoes = [], debutaram = [], mesNome }: Props) {
    const hasLetterCounts = Object.keys(letterCounts).length > 0
    const inicio = currentPage === 1 && !search && !type && !active && !letter && !generation && !order
    const numero = (n: number) => n.toLocaleString(intlLocale())

    function buildHref(overrides: Record<string, string | undefined> = {}) {
        const params = new URLSearchParams()
        const next = { search, type, active, letter, generation, order, ...overrides }
        if (next.search) params.set('search', next.search)
        if (next.type) params.set('type', next.type)
        if (next.active) params.set('active', next.active)
        if (next.letter) params.set('letter', next.letter)
        if (next.generation) params.set('generation', next.generation)
        if (next.order) params.set('order', next.order)
        const page = overrides.page
        if (page && page !== '1') params.set('page', page)
        const qs = params.toString()
        return `/groups${qs ? `?${qs}` : ''}`
    }
    const proximaPagina = currentPage < totalPages ? buildHref({ page: String(currentPage + 1) }) : null
    const restantes = Math.max(0, total - currentPage * 48)

    const leaderboard = ADSENSE.slots.leaderboard
    const inline = ADSENSE.slots.inline

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Grupos K-Pop | ${SITE_NAME}`,
                description: 'Grupos e bandas K-Pop — girl groups, boy groups e mais.',
                url: `${SITE_URL}/groups`,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            {/* ── Topo: título, busca e tipo numa faixa só; geração logo abaixo ── */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className={`${SERIF} whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]`}>
                        Grupos<span className="sr-only"> K-Pop</span><span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{numero(total)}</span>
                    </h1>
                    <SearchInput placeholder="Buscar por nome ou hangul" current={search} className="!h-12 border-border-strong bg-surface lg:!w-full lg:max-w-[560px] lg:flex-1" />
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0" role="group" aria-label="Tipo de grupo">
                        <Link href={buildHref({ type: undefined, letter: undefined, page: '1' })} className={chip(!type)}>Todos</Link>
                        {TYPE_FILTERS.map(f => (
                            <Link key={f.value} href={buildHref({ type: f.value, letter: undefined, page: '1' })} className={chip(type === f.value)}>{f.label}</Link>
                        ))}
                    </div>
                </div>
                <div className="-mx-4 mt-3.5 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0" role="group" aria-label="Geração e status">
                    <span className={`${KICKER} mr-1.5 shrink-0 text-muted`}>Geração</span>
                    {GENERATIONS.map(g => (
                        <Link key={g.slug} href={buildHref({ generation: generation === g.slug ? undefined : g.slug, page: '1' })}
                            className={`flex h-8 shrink-0 items-center border px-3 text-[12px] font-bold ${generation === g.slug ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-foreground hover:border-accent/60'}`}>{g.shortLabel}</Link>
                    ))}
                    <Link href={buildHref({ active: active === 'true' ? undefined : 'true', page: '1' })}
                        className={`ml-auto flex h-8 shrink-0 items-center border px-3 text-[12px] font-bold ${active === 'true' ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-foreground hover:border-accent/60'}`}>Só ativos</Link>
                </div>
            </section>

            {inicio && <ContinueDeOndeParou />}

            {/* ── Em alta ── */}
            {inicio && emAlta.length > 0 && (
                <section className="page-wrap pt-8" data-bloco="lista-em-alta">
                    <h2 className={H2}>Em alta</h2>
                    <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 lg:gap-4">
                        {emAlta.slice(0, 6).map((g, i) => {
                            const foto = getWPImage(g._embedded, g.featured_image_url)
                            const nome = stripHtml(g.title.rendered)
                            const acf = g.acf ?? {}
                            const meta = [acf.type ? (TYPE_PT[acf.type] ?? acf.type) : '', getYear(acf.debut_date)].filter(Boolean).join(' · ')
                            return (
                                <li key={g.id} className="w-[150px] shrink-0 sm:w-auto">
                                    <Link href={`/groups/${g.slug}`} data-posicao={i + 1} className="group block">
                                        <span className="relative block aspect-3/4 overflow-hidden bg-surface">
                                            {foto && <Image src={foto.src} alt={foto.alt || nome} fill priority={i < 3} sizes="(max-width: 640px) 150px, (max-width: 1024px) 33vw, 16vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
                                        </span>
                                        <span className="mt-2.5 flex items-baseline justify-between gap-2">
                                            <span className="truncate text-[15px] font-extrabold sm:text-[16px]">{nome}</span>
                                            {acf.name_hangul && <span className="hidden shrink-0 text-[11px] text-muted xl:inline">{acf.name_hangul}</span>}
                                        </span>
                                        {meta && <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{meta}</span>}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}
            {inicio && leaderboard && <div className="page-wrap pt-7"><AdSlotInline slot={leaderboard} layout="leaderboard" analyticsPlacement="groups_leaderboard" /></div>}

            {/* ── Explore por geração ── */}
            {inicio && geracoes.length > 0 && (
                <section className="page-wrap pt-10" data-bloco="lista-geracoes">
                    <h2 className={H2}>Explore por geração</h2>
                    <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                        {geracoes.map(ger => (
                            <li key={ger.slug}>
                                <Link href={buildHref({ generation: ger.slug, page: '1' })} className="block border border-border-strong bg-surface p-3 transition-colors hover:border-accent/60 sm:p-[18px]">
                                    <span className={`${SERIF} block text-[19px] font-semibold sm:text-[24px]`}>{ger.label}</span>
                                    <span className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-1.5">
                                        {ger.fotos.slice(0, 4).map((g, i) => {
                                            const foto = getWPImage(g._embedded, g.featured_image_url)
                                            return (
                                                <span key={g.id} className={`relative aspect-square overflow-hidden bg-background ${i > 1 ? 'hidden sm:block' : ''}`}>
                                                    {foto && <Image src={foto.src} alt="" fill sizes="80px" className="object-cover object-top" />}
                                                </span>
                                            )
                                        })}
                                    </span>
                                    <span className="mt-3 block text-[12px] font-semibold text-accent sm:text-[13px]">Ver a geração →</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ── Debutaram no mês ── */}
            {inicio && debutaram.length > 0 && mesNome && (
                <section className="page-wrap pt-10" data-bloco="lista-debut-mes">
                    <h2 className={H2}>Debutaram em {mesNome}</h2>
                    <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
                        {debutaram.slice(0, 5).map((d, i) => (
                            <li key={d.slug} className="w-[170px] shrink-0 sm:w-auto">
                                <Link href={`/groups/${d.slug}`} data-posicao={i + 1} className="block border border-border-strong bg-surface p-4 transition-colors hover:border-accent/60">
                                    <span className={`${KICKER} block text-accent`}>{String(d.dia).padStart(2, '0')} de {mesNome.slice(0, 3)}</span>
                                    <span className="mt-1.5 block truncate text-[18px] font-extrabold">{d.nome}</span>
                                    <span className="mt-1 block text-[13px] text-muted">Estreou em {d.ano}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ── Todos os grupos ── */}
            <section className="page-wrap pt-10" data-bloco="lista-todos">
                <div className="flex flex-col gap-1 border-b border-border sm:flex-row sm:items-end sm:justify-between">
                    <h2 className={`${H2} sm:order-2 sm:pb-3`}>Todos os grupos</h2>
                    <div className="-mx-4 flex gap-6 overflow-x-auto px-4 sm:order-1 sm:mx-0 sm:px-0" role="group" aria-label="Ordenar">
                        <Link href={buildHref({ order: undefined, letter: undefined, page: '1' })} className={aba(!order)}>Populares</Link>
                        <Link href={buildHref({ order: 'az', page: '1' })} className={aba(order === 'az')}>A–Z</Link>
                        <Link href={buildHref({ order: 'novos', letter: undefined, page: '1' })} className={aba(order === 'novos')}>Novos</Link>
                    </div>
                </div>

                {order === 'az' && (
                    <BarraAncorada deslocamento={44} z={10} className="border-b border-border bg-background">
                        <div className="relative">
                            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-linear-to-r from-transparent to-background" />
                            <div className="flex gap-0.5 overflow-x-auto py-2 pr-10" style={{ scrollbarWidth: 'none' }}>
                                {ALPHA.map(L => {
                                    const count = letterCounts[L] ?? 0
                                    const isActive = letter === L
                                    const disabled = hasLetterCounts && count === 0
                                    return (
                                        <Link key={L} href={disabled ? '#' : buildHref({ letter: isActive ? undefined : L, page: '1' })} aria-disabled={disabled}
                                            className={`flex h-9 w-[30px] shrink-0 items-center justify-center font-mono text-[13px] font-bold transition-colors sm:w-[34px] ${isActive ? 'bg-accent-a11y text-white' : disabled ? 'cursor-default text-muted/30' : 'text-foreground hover:bg-surface'}`}>{L}</Link>
                                    )
                                })}
                            </div>
                        </div>
                    </BarraAncorada>
                )}

                <div className="py-6 sm:py-7">
                    {groups.length === 0 ? (
                        <EmptyState
                            icon={<Users size={48} />}
                            title="Nenhum grupo encontrado"
                            description={search ? `Nenhum resultado para "${search}"` : letter ? `Nenhum grupo com a letra ${letter}` : 'Sem grupos disponíveis'}
                            actionHref="/groups"
                            actionLabel="Ver todos"
                        />
                    ) : (
                        // Fatias de 12 (divide 2, 3, 4 e 6 colunas) com o anúncio entre elas, fora da grade, para não deixar órfãos.
                        (() => {
                            const CORTE = 12
                            const temAnuncio = !!inline && groups.length >= CORTE * 2
                            const blocos = temAnuncio ? [groups.slice(0, CORTE), groups.slice(CORTE)] : [groups]
                            let offset = 0
                            return blocos.map((bloco, b) => {
                                const inicioBloco = offset
                                offset += bloco.length
                                return (
                                    <Fragment key={b}>
                                        {b > 0 && <div className="my-6"><AdSlotInline slot={inline!} layout="feed" analyticsPlacement="groups_grid" /></div>}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6 lg:gap-x-4">
                                            {bloco.map((g, i) => <GroupTile key={g.id} group={g} priority={!inicio && inicioBloco + i < 6} />)}
                                        </div>
                                    </Fragment>
                                )
                            })
                        })()
                    )}

                    {proximaPagina && (
                        <div className="mt-8 flex justify-center">
                            <Link href={proximaPagina} className="touch-target inline-flex h-12 items-center border border-accent px-7 text-[15px] font-bold text-accent hover:bg-accent/10">
                                Ver mais {numero(restantes)} {restantes === 1 ? 'grupo' : 'grupos'}
                            </Link>
                        </div>
                    )}
                    <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={(page) => buildHref({ page: String(page) })} />
                </div>
            </section>
        </>
    )
}

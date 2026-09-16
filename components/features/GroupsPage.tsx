import { htmlLang, intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import { BarraAncorada } from '@/components/ui/BarraAncorada'
import Link from 'next/link'
import { Fragment } from 'react'
import { Users } from 'lucide-react'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, getYear, stripHtml } from '@/lib/utils'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { EmptyState } from '@/components/ui/EmptyState'
import { GENERATIONS, getGeneration } from '@/lib/constants/generations'
import { CatalogIntro } from '@/components/ui/CatalogIntro'

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
    letterCounts: Record<string, number>
}

const chip = (active: boolean) =>
    `inline-flex h-8 shrink-0 items-center rounded-md px-3 text-[12px] font-bold transition-colors ${
        active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
    }`

export function GroupsPage({ groups, total, totalPages, currentPage, search, type, active, letter, generation, letterCounts }: Props) {
    const hasLetterCounts = Object.keys(letterCounts).length > 0

    function buildHref(overrides: Record<string, string | undefined> = {}) {
        const params = new URLSearchParams()
        const next = { search, type, active, letter, generation, ...overrides }
        if (next.search) params.set('search', next.search)
        if (next.type) params.set('type', next.type)
        if (next.active) params.set('active', next.active)
        if (next.letter) params.set('letter', next.letter)
        if (next.generation) params.set('generation', next.generation)
        const page = overrides.page
        if (page && page !== '1') params.set('page', page)
        const qs = params.toString()
        return `/groups${qs ? `?${qs}` : ''}`
    }

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

            <ResponsiveFilterBar label="Filtros" value="Grupos">
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-2 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">

                        {/* TIPO */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Tipo</span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                <Link href={buildHref({ type: undefined, active: undefined, letter: undefined, page: '1' })}
                                    className={chip(!type && !active)}>Todos</Link>
                                {TYPE_FILTERS.map(f => (
                                    <Link key={f.value} href={buildHref({ type: f.value, active: undefined, letter: undefined, page: '1' })}
                                        className={chip(type === f.value)}>{f.label}</Link>
                                ))}
                            </div>
                        </div>

                        {/* STATUS */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Status</span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                <Link href={buildHref({ active: undefined, page: '1' })} className={chip(!active)}>Todos</Link>
                                <Link href={buildHref({ active: active === 'true' ? undefined : 'true', page: '1' })} className={chip(active === 'true')}>Ativos</Link>
                                <Link href={buildHref({ active: active === 'false' ? undefined : 'false', page: '1' })} className={chip(active === 'false')}>Encerrados</Link>
                            </div>
                        </div>

                        {/* GERAÇÃO */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Geração</span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                <Link href={buildHref({ generation: undefined, page: '1' })} className={chip(!generation)}>Todas</Link>
                                {GENERATIONS.map(g => (
                                    <Link key={g.slug} href={buildHref({ generation: generation === g.slug ? undefined : g.slug, page: '1' })}
                                        className={chip(generation === g.slug)}>{g.shortLabel}</Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SearchInput placeholder="Buscar grupo..." current={search} className="lg:ml-auto lg:shrink-0" />
                </div>
            </ResponsiveFilterBar>

            <CatalogIntro
                title="Grupos K-Pop"
                description="Grupos e bandas organizados por geração, formação e atividade, com perfis editoriais em português."
                count={total}
                countLabel="grupos no catálogo"
            />

            {/* Alphabet bar */}
            <BarraAncorada deslocamento={44} z={10} className="border-b border-border bg-background">
                <div className="page-wrap">
                    <div className="relative">
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-linear-to-r from-transparent to-background" />
                        <div className="flex gap-0.5 overflow-x-auto py-2 pr-10" style={{ scrollbarWidth: 'none' }}>
                            {ALPHA.map(L => {
                                const count = letterCounts[L] ?? 0
                                const isActive = letter === L
                                const disabled = hasLetterCounts && count === 0
                                return (
                                    <Link key={L}
                                        href={disabled ? '#' : buildHref({ letter: isActive ? undefined : L, page: '1' })}
                                        aria-disabled={disabled}
                                        className={`flex w-[30px] shrink-0 flex-col items-center py-1.5 font-mono transition-colors sm:w-[34px] ${
                                            isActive ? 'bg-accent-a11y text-white' :
                                            disabled ? 'cursor-default text-muted/30' :
                                            'text-foreground hover:bg-surface'
                                        }`}>
                                        <span className="text-[13px] font-bold leading-none">{L}</span>
                                        {count > 0 && <span className="mt-0.5 text-[8px] opacity-60">{count}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </BarraAncorada>

            {/* Letter heading */}
            {letter && (
                <div className="page-wrap pt-8 pb-4">
                    <div className="flex items-baseline gap-5">
                        <span className="font-serif text-[80px] sm:text-[96px] italic font-black leading-[0.85] tracking-[-0.06em] text-accent">{letter}</span>
                        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                            {total.toLocaleString(intlLocale())} grupos · letra {letter}
                        </p>
                    </div>
                </div>
            )}

            <div className="page-wrap py-6 sm:py-8">
                {groups.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} />}
                        title="Nenhum grupo encontrado"
                        description={search ? `Nenhum resultado para "${search}"` : letter ? `Nenhum grupo com a letra ${letter}` : 'Sem grupos disponíveis'}
                        actionHref="/groups"
                        actionLabel="Ver todos"
                    />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-6">
                                pág. {currentPage} de {totalPages}
                            </p>
                        )}
                        {/* Buraco no fim da linha é aritmética, não estilo. Duas regras
                            mantêm as linhas cheias:
                            1. Toda contagem de colunas divide a página de 48 — 1, 3, 4 e 6.
                               A grade antiga ia a 5 no lg, e 48÷5 deixava 3 células vazias
                               em toda página cheia.
                            2. O anúncio não mora dentro da grade. Como `col-span-full`, ele
                               partia a linha no item 10, sobrando órfãos no ponto do corte
                               (1 em 3 colunas, 2 em 4). Agora são duas grades independentes
                               cortadas em 12 — múltiplo de 3, 4 e 6 — com o anúncio entre elas.
                            Sobra só a última página, que tem a contagem que tiver. */}
                        {(() => {
                            const CORTE = 12
                            // Só divide se sobrar bloco de verdade depois do corte: na
                            // última página (11 grupos) o corte criaria uma segunda grade
                            // de um card só, que é justamente o buraco que queremos evitar.
                            const temAnuncio = !!ADSENSE.slots.inline && groups.length >= CORTE * 2
                            const blocos = temAnuncio ? [groups.slice(0, CORTE), groups.slice(CORTE)] : [groups]
                            let offset = 0
                            return blocos.map((bloco, b) => {
                                const inicio = offset
                                offset += bloco.length
                                return (
                                    <Fragment key={b}>
                                        {b > 0 && (
                                            <div className="my-6">
                                                <AdSlotInline slot={ADSENSE.slots.inline!} layout="feed" analyticsPlacement="groups_grid" />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                                            {bloco.map((g, i) => (
                                                <GroupCard key={g.id} group={g} priority={inicio + i < 10} />
                                            ))}
                                        </div>
                                    </Fragment>
                                )
                            })
                        })()}
                    </>
                )}

                {groups.length > 0 && ADSENSE.slots.inline && (
                    <div className="mt-10">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="groups_feed" />
                    </div>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    buildHref={(page) => buildHref({ page: String(page) })}
                />
            </div>
        </>
    )
}

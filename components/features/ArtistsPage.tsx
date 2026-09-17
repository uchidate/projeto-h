'use client'

import { htmlLang, intlLocale } from '@/lib/i18n/format'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Mic2, Search, ArrowUpDown, UserRound, UsersRound, X } from 'lucide-react'
import { useCallback, useRef, useState, useEffect } from 'react'
import type { WPArtist } from '@/lib/wordpress/types'
import { Pagination } from '@/components/ui/Pagination'
import { Fragment } from 'react'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { CatalogIntro } from '@/components/ui/CatalogIntro'
import { BarraAncorada } from '@/components/ui/BarraAncorada'
import { RastreioDeFiltros } from '@/components/analytics/RastreioDeFiltros'

const SORT_OPTIONS = [
    { value: 'popular',  label: 'Populares' },
    { value: 'trending', label: 'Em alta' },
    { value: 'name',     label: 'A–Z'     },
    { value: 'newest',   label: 'Novos'   },
]

const ROLE_OPTIONS = [
    { value: 'singer',  label: 'Cantores'    },
    { value: 'actor',   label: 'Atores'      },
    { value: 'rapper',  label: 'Rappers'     },
    { value: 'dancer',  label: 'Dança'       },
    { value: 'model',   label: 'Modelos'     },
]

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Props {
    artists: WPArtist[]
    total: number
    totalPages: number
    currentPage: number
    search?: string
    role?: string
    affiliation?: 'group' | 'solo'
    letter?: string
    sortBy?: string
    letterCounts: Record<string, number>
}

export function ArtistsPage({ artists, total, totalPages, currentPage, search, role, affiliation, letter, sortBy = 'trending', letterCounts }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchVal, setSearchVal] = useState(search ?? '')
    const [sortVal, setSortVal] = useState(sortBy)
    const [roleVal, setRoleVal] = useState(role ?? '')
    const [affiliationVal, setAffiliationVal] = useState(affiliation ?? '')

    const buildUrl = useCallback((s: string, sort: string, r: string, a: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (s) params.set('search', s); else params.delete('search')
        if (sort && sort !== 'trending') params.set('sortBy', sort); else params.delete('sortBy')
        if (r) params.set('role', r); else params.delete('role')
        if (a) params.set('affiliation', a); else params.delete('affiliation')
        params.delete('page')
        return params.toString() ? `${pathname}?${params}` : pathname
    }, [pathname, searchParams])

    const buildHref = useCallback((overrides: Record<string, string | undefined> = {}) => {
        const params = new URLSearchParams(searchParams.toString())
        const entries: Record<string, string | undefined> = { search, role, affiliation, letter, sortBy, ...overrides }
        if (entries.search) params.set('search', entries.search); else params.delete('search')
        if (entries.role) params.set('role', entries.role); else params.delete('role')
        if (entries.affiliation) params.set('affiliation', entries.affiliation); else params.delete('affiliation')
        if (entries.letter) params.set('letter', entries.letter); else params.delete('letter')
        if (entries.sortBy && entries.sortBy !== 'trending') params.set('sortBy', entries.sortBy); else params.delete('sortBy')
        if (overrides.page && overrides.page !== '1') params.set('page', overrides.page); else params.delete('page')
        return params.toString() ? `${pathname}?${params}` : pathname
    }, [search, role, affiliation, letter, sortBy, pathname, searchParams])

    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (searchVal === (search ?? '')) return
        if (searchRef.current) clearTimeout(searchRef.current)
        searchRef.current = setTimeout(() => router.push(buildUrl(searchVal, sortVal, roleVal, affiliationVal)), 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce da busca: só o texto digitado dispara. Incluir os outros filtros faria cada troca de filtro esperar 400ms de novo
    }, [searchVal])

    useEffect(() => {
        if (sortVal === sortBy) return
        router.push(buildUrl(searchVal, sortVal, roleVal, affiliationVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navega só quando a ordenação muda; os demais filtros entram na URL como valor atual, não como gatilho
    }, [sortVal])

    useEffect(() => {
        if (roleVal === (role ?? '')) return
        router.push(buildUrl(searchVal, sortVal, roleVal, affiliationVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navega só quando o papel muda; os demais filtros entram na URL como valor atual, não como gatilho
    }, [roleVal])

    useEffect(() => {
        if (affiliationVal === (affiliation ?? '')) return
        router.push(buildUrl(searchVal, sortVal, roleVal, affiliationVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navega só quando a afiliação muda; os demais filtros entram na URL como valor atual, não como gatilho
    }, [affiliationVal])

    const clear = () => { setSearchVal(''); setSortVal('trending'); setRoleVal(''); setAffiliationVal('') }
    const hasActive = !!(searchVal || sortVal !== 'trending' || roleVal || affiliationVal)
    const hasLetterCounts = Object.keys(letterCounts).length > 0

    const chipClass = (active: boolean) =>
        `h-8 shrink-0 rounded-md px-3 text-[12px] font-bold transition-colors ${
            active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
        }`
    return (
        <>
            {/* Chaves iguais ao SearchParams de app/(site)/artists/page.tsx. */}
            <RastreioDeFiltros listagem="artistas" filtros={['search', 'page', 'role', 'affiliation', 'letter', 'sortBy']} />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Artistas K-Pop & K-Drama | ${SITE_NAME}`,
                description: 'Perfis de artistas de K-Pop e K-Drama — cantores, atores, idols e mais.',
                url: `${SITE_URL}/artists`,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            {/* ── Filter bar ──────────────────────────────────────── */}
            <ResponsiveFilterBar label="Filtros" value={hasActive ? 'ativos' : 'Artistas'}>
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-2 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">

                        {/* ORDEM */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                                <ArrowUpDown className="h-3 w-3" />
                                Ordem
                            </span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                {SORT_OPTIONS.map(opt => (
                                    <button key={opt.value} type="button" onClick={() => setSortVal(opt.value)} className={chipClass(sortVal === opt.value)}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ATUAÇÃO */}
                        <FilterSelect label="Atuação" labelIcon={<UserRound className="h-3 w-3" />} value={roleVal} onChange={e => setRoleVal(e.target.value)} aria-label="Filtrar por atuação">
                                <option value="">Todas</option>
                                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </FilterSelect>

                        {/* VÍNCULO */}
                        <FilterSelect label="Vínculo" labelIcon={<UsersRound className="h-3 w-3" />} value={affiliationVal} onChange={e => setAffiliationVal(e.target.value)} aria-label="Filtrar por vínculo">
                                <option value="">Todos</option>
                                <option value="group">Em grupo</option>
                                <option value="solo">Solo</option>
                        </FilterSelect>
                    </div>

                    {/* BUSCA */}
                    <div className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground lg:ml-auto lg:h-8 lg:w-[340px] lg:shrink-0">
                        <Search className="h-4 w-4 shrink-0 text-muted" />
                        <input
                            type="text"
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            placeholder="Buscar artista, hangul ou stage name..."
                            className="min-w-0 flex-1 input-embutido border-0 bg-transparent p-0 text-[13px] text-foreground shadow-none placeholder:text-muted focus:outline-hidden"
                        />
                        {hasActive && (
                            <button type="button" onClick={clear}
                                className="flex h-7 shrink-0 items-center justify-center rounded-md bg-surface px-2 text-[11px] font-bold text-muted hover:text-foreground"
                                aria-label="Limpar filtros">
                                <X className="h-3 w-3" />
                                <span className="hidden sm:inline ml-1">Limpar</span>
                            </button>
                        )}
                    </div>
                </div>
            </ResponsiveFilterBar>

            <CatalogIntro
                title="Artistas K-Pop e K-Drama"
                description={`Perfis, carreiras e vínculos de artistas acompanhados pela cobertura editorial da ${SITE_NAME}.`}
                count={total}
                countLabel="perfis no catálogo"
            />

            {/* ── Alphabet bar ─────────────────────────────────────── */}
            <BarraAncorada deslocamento={41} z={10} className="border-b border-border bg-background">
                {/* Alphabet bar with counts */}
                <div className="page-wrap py-2">
                    <div className="relative">
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-linear-to-r from-transparent to-background" />
                        <div className="flex gap-0.5 overflow-x-auto scrollbar-none pr-10">
                            {ALPHA.map(L => {
                                const count = letterCounts[L] ?? 0
                                const active = letter === L
                                // Se o endpoint de contagens falhar, mantém as letras navegáveis.
                                const disabled = hasLetterCounts && count === 0
                                return (
                                    <Link key={L}
                                        href={disabled ? '#' : buildHref({ letter: active ? undefined : L, page: '1' })}
                                        aria-disabled={disabled}
                                        className={`flex flex-col items-center shrink-0 w-[30px] sm:w-[34px] py-1.5 font-mono transition-colors ${
                                            active ? 'bg-accent-a11y text-white' :
                                            disabled ? 'text-muted/30 cursor-default' :
                                            'text-foreground hover:bg-surface'
                                        }`}>
                                        <span className="text-[13px] font-bold leading-none">{L}</span>
                                        {count > 0 && <span className="text-[8px] opacity-60 mt-0.5">{count}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </BarraAncorada>

            {/* ── Letter heading ───────────────────────────────────── */}
            {letter && (
                <div className="page-wrap pt-8 pb-4">
                    <div className="flex items-baseline gap-5">
                        <span className="font-serif text-[80px] sm:text-[96px] italic font-black leading-[0.85] tracking-[-0.06em] text-accent">{letter}</span>
                        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                            {(letterCounts[letter] ?? total).toLocaleString(intlLocale())} artistas · letra {letter}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Grid ─────────────────────────────────────────────── */}
            <div className="page-wrap py-6 sm:py-8">
                {artists.length === 0 ? (
                    <EmptyState
                        icon={<Mic2 size={48} />}
                        title="Nenhum artista encontrado"
                        description={search ? `Nenhum resultado para "${search}"` : letter ? `Nenhum artista com a letra ${letter}` : 'Sem artistas disponíveis'}
                        actionHref="/artists"
                        actionLabel="Ver todos"
                    />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-6">
                                pág. {currentPage} de {totalPages} · {total.toLocaleString(intlLocale())} artistas
                            </p>
                        )}
                        {/* Duas grades com o anúncio entre elas, em vez de um col-span-full
                            no meio do fluxo. A grade tem 2/4/5/7 colunas conforme o
                            breakpoint e nenhum índice fixo é divisível por todos, então o
                            anúncio inline sempre cortava uma fileira ao meio e deixava
                            células vazias ao seu lado. Separadas, cada grade fecha as
                            próprias fileiras em qualquer largura. */}
                        {/* Um invólucro só em volta das fatias: a grade é cortada pelo anúncio,
                          * e marcar cada fatia reiniciaria a posição do card no meio da lista. */}
                        <div data-bloco="listagem-artistas" className="contents">
                        {(() => {
                            const CORTE = 24
                            const temAnuncio = !!ADSENSE.slots.inline && artists.length > CORTE
                            const blocos = temAnuncio ? [artists.slice(0, CORTE), artists.slice(CORTE)] : [artists]
                            let offset = 0
                            return blocos.map((bloco, b) => {
                                const base = offset
                                offset += bloco.length
                                return (
                                    <Fragment key={`bloco-${b}`}>
                                        {b > 0 && (
                                            <div className="my-2">
                                                <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="artists_grid" />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                                            {bloco.map((a, i) => (
                                                <ArtistCard key={a.id} artist={a} priority={base + i < 14} variant="catalog"
                                                    showTrendingBadge={sortVal !== 'trending'}
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14vw" />
                                            ))}
                                        </div>
                                    </Fragment>
                                )
                            })
                        })()}
                        </div>
                    </>
                )}

                {artists.length > 0 && ADSENSE.slots.inline && (
                    <div className="mt-10">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="artists_feed" />
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

'use client'

import { htmlLang, intlLocale } from '@/lib/i18n/format'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Mic2, Search, X } from 'lucide-react'
import { useCallback, useRef, useState, useEffect } from 'react'
import type { WPArtist } from '@/lib/wordpress/types'
import { Pagination } from '@/components/ui/Pagination'
import { Fragment } from 'react'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { RastreioDeFiltros } from '@/components/analytics/RastreioDeFiltros'
import { ContinueDeOndeParou } from '@/components/artists/lista/ContinueDeOndeParou'
import { EmAlta } from '@/components/artists/lista/EmAlta'
import { AniversariosSemana } from '@/components/artists/lista/AniversariosSemana'
import { SalvarContextoLista } from '@/components/artists/lista/SalvarContextoLista'
import { labelsFor } from '@/lib/i18n/labels'
import { getWPImage, stripHtml } from '@/lib/utils'
import type { AniversarianteSemana } from '@/lib/artists/aniversarios'

const SORT_OPTIONS = [
    { value: 'trending', label: 'Em alta' },
    { value: 'popular',  label: 'Populares' },
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
    perPage?: number
    aniversarios?: AniversarianteSemana[]
}

export function ArtistsPage({ artists, total, totalPages, currentPage, search, role, affiliation, letter, sortBy = 'trending', letterCounts, perPage = 48, aniversarios = [] }: Props) {
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

    const labels = labelsFor(useLocale())
    const SERIF = 'font-[family-name:var(--font-playfair)]'
    const numero = (n: number) => n.toLocaleString(intlLocale())

    // Página inicial sem filtro: é onde entram as faixas de descoberta. Com busca, filtro ou letra, o leitor já sabe o que quer.
    const semRecorte = !searchVal && !roleVal && !affiliationVal && !letter
    const inicio = currentPage === 1 && semRecorte
    const emAltaArtistas = inicio && sortBy === 'trending' ? artists.slice(0, 6) : []
    const grade = emAltaArtistas.length > 0 ? artists.slice(emAltaArtistas.length) : artists

    const rotulo = [SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Em alta', ROLE_OPTIONS.find(o => o.value === role)?.label, affiliation === 'group' ? 'Em grupo' : affiliation === 'solo' ? 'Solo' : undefined, letter ? `Letra ${letter}` : undefined, search ? `“${search}”` : undefined].filter(Boolean).join(' · ')
    const contexto = {
        href: searchParams.toString() ? `${pathname}?${searchParams}` : pathname,
        rotulo,
        inicio: (currentPage - 1) * perPage + 1,
        total,
        itens: artists.map(a => ({
            slug: a.slug,
            nome: stripHtml(a.title.rendered),
            foto: getWPImage(a._embedded, a.featured_image_url)?.src ?? null,
            papel: (a.acf?.roles as string[] | undefined)?.map(labels.role)[0] ?? null,
        })),
    }

    const chip = (ativo: boolean) =>
        `touch-target flex h-10 shrink-0 items-center border px-4 text-[14px] font-semibold transition-colors ${ativo ? 'border-accent text-accent' : 'border-border-strong text-foreground hover:border-accent/60'}`
    const aba = (ativo: boolean) =>
        `flex h-9 shrink-0 items-center px-3.5 text-[14px] font-semibold transition-colors ${ativo ? 'bg-foreground text-background' : 'text-foreground-subtle hover:text-foreground'}`
    const seletor = 'h-11 min-w-0 flex-1 border border-border-strong bg-background px-3 py-0 text-[14px] leading-none text-foreground-subtle lg:h-9 lg:w-[176px] lg:flex-none'
    const proximaPagina = currentPage < totalPages ? buildHref({ page: String(currentPage + 1) }) : null

    return (
        <>
            {/* Chaves iguais ao SearchParams de app/(site)/artists/page.tsx. */}
            <RastreioDeFiltros listagem="artistas" filtros={['search', 'page', 'role', 'affiliation', 'letter', 'sortBy']} />
            <SalvarContextoLista contexto={contexto} />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Artistas K-Pop & K-Drama | ${SITE_NAME}`,
                description: 'Perfis de artistas de K-Pop e K-Drama — cantores, atores, idols e mais.',
                url: `${SITE_URL}/artists`,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            {/* ── Topo: título, busca e atalhos por atuação numa faixa só ── */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className={`${SERIF} whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]`}>
                        Artistas<span className="sr-only"> K-Pop e K-Drama</span><span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{numero(total)}</span>
                    </h1>
                    <div className="flex h-12 w-full min-w-0 items-center gap-3 border border-border-strong bg-surface px-4 transition-colors focus-within:border-foreground lg:max-w-[560px] lg:flex-1">
                        <Search className="h-[18px] w-[18px] shrink-0 text-muted" />
                        <input
                            type="text"
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            placeholder="Buscar por nome ou hangul"
                            aria-label="Buscar artista por nome ou hangul"
                            className="min-w-0 flex-1 input-embutido border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none placeholder:text-muted focus:outline-hidden"
                        />
                        {hasActive && (
                            <button type="button" onClick={clear} className="flex h-7 shrink-0 items-center justify-center bg-background px-2 text-[11px] font-bold text-muted hover:text-foreground" aria-label="Limpar filtros">
                                <X className="h-3 w-3" /><span className="ml-1 hidden sm:inline">Limpar</span>
                            </button>
                        )}
                    </div>
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0" role="group" aria-label="Atalhos por atuação">
                        <button type="button" onClick={() => setRoleVal('')} aria-pressed={roleVal === ''} className={chip(roleVal === '')}>Todos</button>
                        {ROLE_OPTIONS.map(o => (
                            <button key={o.value} type="button" onClick={() => setRoleVal(roleVal === o.value ? '' : o.value)} aria-pressed={roleVal === o.value} className={chip(roleVal === o.value)}>{o.label}</button>
                        ))}
                    </div>
                </div>
            </section>

            {inicio && <ContinueDeOndeParou />}
            <EmAlta artistas={emAltaArtistas} verTodos="#diretorio" />
            {inicio && ADSENSE.slots.leaderboard && (
                <div className="page-wrap pb-8">
                    <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="artists_apos_destaque" />
                </div>
            )}
            {inicio && <AniversariosSemana itens={aniversarios} />}

            {/* ── Diretório completo ───────────────────────────────── */}
            <section id="diretorio" className="scroll-mt-24 border-t border-border/70 pb-10 pt-8 sm:pt-9">
                <div className="page-wrap">
                    <h2 className={`${SERIF} text-[28px] font-semibold leading-tight sm:text-[38px]`}>Todos os artistas</h2>

                    <div className="mt-6 flex flex-col gap-3 border-y border-border/70 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:py-0">
                        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="group" aria-label="Ordenar por">
                            {SORT_OPTIONS.map(o => (
                                <button key={o.value} type="button" onClick={() => setSortVal(o.value)} aria-pressed={sortVal === o.value} className={aba(sortVal === o.value)}>{o.label}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <select value={roleVal} onChange={e => setRoleVal(e.target.value)} aria-label="Filtrar por atuação" className={seletor}>
                                <option value="">Atuação: Todas</option>
                                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={affiliationVal} onChange={e => setAffiliationVal(e.target.value)} aria-label="Filtrar por vínculo" className={seletor}>
                                <option value="">Vínculo: Todos</option>
                                <option value="group">Em grupo</option>
                                <option value="solo">Solo</option>
                            </select>
                        </div>
                    </div>

                    {/* Índice A–Z: só as letras, sem contagem */}
                    <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:justify-between lg:gap-0 lg:px-0" aria-label="Índice de A a Z">
                        {ALPHA.map(L => {
                            const count = letterCounts[L] ?? 0
                            const active = letter === L
                            // Se o endpoint de contagens falhar, mantém as letras navegáveis.
                            const disabled = hasLetterCounts && count === 0
                            return (
                                <Link key={L} href={disabled ? '#' : buildHref({ letter: active ? undefined : L, page: '1' })} aria-disabled={disabled}
                                    className={`touch-target flex h-11 w-10 shrink-0 items-center justify-center border text-[14px] font-bold transition-colors lg:h-9 lg:w-8 lg:border-transparent lg:text-[15px] ${
                                        active ? 'border-accent bg-accent text-[#0d0b0f]' : disabled ? 'border-border/60 text-muted/30 cursor-default' : 'border-border text-foreground hover:border-accent/60'
                                    }`}>
                                    {L}
                                </Link>
                            )
                        })}
                    </div>

                    {letter && (
                        <div className="flex items-baseline gap-5 pt-8">
                            <span className={`${SERIF} text-[72px] font-black leading-[0.85] tracking-[-0.06em] text-accent sm:text-[88px]`}>{letter}</span>
                            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{numero(letterCounts[letter] ?? total)} artistas · letra {letter}</p>
                        </div>
                    )}

                    <div className="mt-6 sm:mt-7">
                        {artists.length === 0 ? (
                            <EmptyState
                                icon={<Mic2 size={48} />}
                                title="Nenhum artista encontrado"
                                description={search ? `Nenhum resultado para "${search}"` : letter ? `Nenhum artista com a letra ${letter}` : 'Sem artistas disponíveis'}
                                actionHref="/artists"
                                actionLabel="Ver todos"
                            />
                        ) : (
                            // Fatias de 12: fecham as fileiras de 2, 3, 4 e 6 colunas, então o anúncio entre elas
                            // nunca deixa célula vazia. Um invólucro só, para a posição do card não reiniciar em cada fatia.
                            <div data-bloco="listagem-artistas" className="contents">
                                {(() => {
                                    const FATIA = 12
                                    const fatias: WPArtist[][] = []
                                    for (let i = 0; i < grade.length; i += FATIA) fatias.push(grade.slice(i, i + FATIA))
                                    let deslocamento = emAltaArtistas.length
                                    let anuncios = 0
                                    return fatias.map((fatia, b) => {
                                        const base = deslocamento
                                        deslocamento += fatia.length
                                        const comAnuncio = b > 0 && anuncios < 3 && !!ADSENSE.slots.inline
                                        if (comAnuncio) anuncios++
                                        return (
                                            <Fragment key={`fatia-${b}`}>
                                                {comAnuncio && (
                                                    <div className="my-7 sm:my-9">
                                                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="artists_grid" />
                                                    </div>
                                                )}
                                                <div className={`grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-6 ${b > 0 && !comAnuncio ? 'mt-5 sm:mt-6' : ''}`}>
                                                    {fatia.map((a, i) => (
                                                        <ArtistCard key={a.id} artist={a} priority={base + i < 8} variant="diretorio"
                                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                                                    ))}
                                                </div>
                                            </Fragment>
                                        )
                                    })
                                })()}
                            </div>
                        )}
                    </div>

                    {proximaPagina && (
                        <div className="mt-10 flex justify-center">
                            <Link href={proximaPagina} className="touch-target flex h-[52px] w-full items-center justify-center border border-accent px-8 text-[15px] font-bold text-accent hover:bg-accent/10 sm:w-auto">
                                Ver mais {numero(perPage)} artistas
                            </Link>
                        </div>
                    )}
                    <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={(page) => buildHref({ page: String(page) })} />
                </div>
            </section>

            {/* ── Continue explorando ─────────────────────────────── */}
            <section className="border-t border-border bg-surface/60 py-9 sm:py-11" data-bloco="lista-explorar">
                <div className="page-wrap">
                    <h2 className={`${SERIF} text-[26px] font-semibold leading-tight sm:text-[34px]`}>Continue explorando</h2>
                    <ul className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
                        {[['Grupos K-Pop', '/groups'], ['Por agência', '/agencies'], ['Aniversariantes do mês', '/artists/birthdays']].map(([nome, href], i) => (
                            <li key={href}>
                                <Link href={href} data-posicao={i + 1} className={`block border border-border px-[18px] py-5 hover:border-accent/60 sm:px-6 sm:py-7 ${SERIF} text-[22px] sm:text-[26px]`}>{nome} →</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    )
}

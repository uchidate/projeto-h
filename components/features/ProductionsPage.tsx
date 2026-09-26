import Link from 'next/link'
import { Fragment } from 'react'
import Image from 'next/image'
import { Film } from 'lucide-react'
import { intlLocale } from '@/lib/i18n/format'
import { getWPImage } from '@/lib/utils'
import { ContinueDeOndeParou } from '@/components/artists/lista/ContinueDeOndeParou'
import type { WPProduction, WPTerm } from '@/lib/wordpress/types'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { ProductionsFilterSelects } from '@/components/features/ProductionsFilterSelects'
import { ProductionCard } from '@/components/productions/ProductionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { RastreioDeFiltros } from '@/components/analytics/RastreioDeFiltros'

export interface GeneroResumo { slug: string; nome: string; fotos: WPProduction[] }

interface Props {
    productions: WPProduction[]
    total: number
    totalPages: number
    genres: WPTerm[]
    platforms: WPTerm[]
    currentPage: number
    currentGenre?: string
    currentPlatform?: string
    currentType?: string
    currentOrder?: string
    search?: string
    emAlta?: WPProduction[]
    plataformasTop?: WPTerm[]
    generosTop?: GeneroResumo[]
}

const SERIF = 'font-[family-name:var(--font-playfair)]'
const H2 = `${SERIF} text-[26px] font-semibold leading-tight sm:text-[32px]`
const TIPOS = [
    { value: 'drama', label: 'Doramas' },
    { value: 'movie', label: 'Filmes' },
    { value: 'special', label: 'Especiais' },
    { value: 'variety', label: 'Variety' },
]

const chip = (ativo: boolean) =>
    `touch-target flex h-9 shrink-0 items-center border px-3.5 text-[13px] font-bold transition-colors ${ativo ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-foreground hover:border-accent/60'}`
const aba = (ativo: boolean) =>
    `flex h-11 shrink-0 items-center border-b-2 text-[14px] font-semibold transition-colors ${ativo ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground'}`

export function ProductionsPage({
    productions, total, totalPages, genres, platforms,
    currentPage, currentGenre, currentPlatform, currentType, currentOrder = 'trending', search,
    emAlta = [], plataformasTop = [], generosTop = [],
}: Props) {
    const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))
    const numero = (n: number) => n.toLocaleString(intlLocale())
    // Faixas de descoberta só na página inicial sem filtro: com busca ou filtro o leitor já sabe o que quer.
    const inicio = currentPage === 1 && !search && !currentType && !currentGenre && !currentPlatform && currentOrder === 'trending'

    function buildHref(overrides: Record<string, string | undefined> = {}) {
        const params = new URLSearchParams()
        const next = { genre: currentGenre, platform: currentPlatform, type: currentType, order: currentOrder, search, ...overrides }
        if (next.type) params.set('type', next.type)
        if (next.genre) params.set('genre', next.genre)
        if (next.platform) params.set('platform', next.platform)
        if (next.order && next.order !== 'trending') params.set('order', next.order)
        if (next.search) params.set('search', next.search)
        const page = overrides.page
        if (page && page !== '1') params.set('page', page)
        const qs = params.toString()
        return `/productions${qs ? `?${qs}` : ''}`
    }
    // Na página inicial os 6 primeiros já estão em "Em alta": a grade segue dali, sem repetir.
    const grade = inicio && emAlta.length > 0 ? productions.slice(6) : productions
    const proximaPagina = currentPage < totalPages ? buildHref({ page: String(currentPage + 1) }) : null
    const restantes = Math.max(0, total - currentPage * 24)

    return (
        <>
            {/* Chaves iguais ao SearchParams de app/(site)/productions/page.tsx. */}
            <RastreioDeFiltros listagem="producoes" filtros={['genre', 'platform', 'type', 'order', 'page', 'search']} />

            {/* ── Topo: título, busca e tipo numa faixa só; gênero e plataforma logo abaixo ── */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className={`${SERIF} whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]`}>
                        Produções<span className="sr-only"> coreanas: doramas, filmes e séries</span><span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{numero(total)}</span>
                    </h1>
                    <SearchInput placeholder="Buscar produção por título" current={search} className="!h-12 border-border-strong bg-surface lg:!w-full lg:max-w-[560px] lg:flex-1" />
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0" role="group" aria-label="Tipo de produção">
                        <Link href={buildHref({ type: undefined, genre: undefined, platform: undefined, page: '1' })} className={chip(!currentType)}>Todos</Link>
                        {TIPOS.map(t => (
                            <Link key={t.value} href={buildHref({ type: t.value, page: '1' })} className={chip(currentType === t.value)}>{t.label}</Link>
                        ))}
                    </div>
                </div>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <ProductionsFilterSelects genres={genres} platforms={platforms} currentGenre={currentGenre} currentPlatform={currentPlatform} />
                </div>
            </section>

            {inicio && <ContinueDeOndeParou apenas="producao" />}

            {/* ── Em alta ── */}
            {inicio && emAlta.length > 0 && (
                <section className="page-wrap pt-8" data-bloco="lista-em-alta">
                    <h2 className={H2}>Em alta</h2>
                    <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 lg:gap-4">
                        {emAlta.slice(0, 6).map((p, i) => (
                            <li key={p.id} className="w-[140px] shrink-0 sm:w-auto" data-posicao={i + 1}>
                                <ProductionCard production={p} priority={i < 3} variant="catalog" genreMap={genreMap} sizes="(max-width: 640px) 140px, (max-width: 1024px) 33vw, 16vw" />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {inicio && ADSENSE.slots.leaderboard && <div className="page-wrap pt-7"><AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="productions_leaderboard" /></div>}

            {/* ── Onde assistir ── */}
            {inicio && plataformasTop.length > 0 && (
                <section className="page-wrap pt-10" data-bloco="lista-plataformas">
                    <h2 className={H2}>Onde assistir</h2>
                    <ul className="-mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 lg:gap-3">
                        {plataformasTop.slice(0, 6).map(pl => (
                            <li key={pl.id} className="shrink-0 sm:shrink">
                                <Link href={buildHref({ platform: pl.slug, page: '1' })} className="touch-target flex h-12 items-center border border-border-strong bg-surface px-4 text-[15px] font-extrabold transition-colors hover:border-accent/60 sm:h-auto sm:flex-col sm:items-start sm:gap-1.5 sm:px-3.5 sm:py-4 sm:text-[17px]">
                                    {pl.name}
                                    <span className="hidden text-[12px] font-semibold text-accent sm:inline">Ver títulos →</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ── Explore por gênero ── */}
            {inicio && generosTop.length > 0 && (
                <section className="page-wrap pt-10" data-bloco="lista-generos">
                    <h2 className={H2}>Explore por gênero</h2>
                    <ul className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-4">
                        {generosTop.map(gn => (
                            <li key={gn.slug}>
                                <Link href={buildHref({ genre: gn.slug, page: '1' })} className="flex flex-col gap-2.5 border border-border-strong bg-surface p-2.5 transition-colors hover:border-accent/60 lg:flex-row lg:items-center lg:gap-4 lg:p-3.5">
                                    <span className="flex gap-1 lg:gap-1.5">
                                        {gn.fotos.slice(0, 3).map(p => {
                                            const foto = getWPImage(p._embedded, p.featured_image_url)
                                            return (
                                                <span key={p.id} className="relative aspect-2/3 flex-1 overflow-hidden bg-background lg:h-[84px] lg:w-14 lg:flex-none">
                                                    {foto && <Image src={foto.src} alt="" fill sizes="56px" className="object-cover" />}
                                                </span>
                                            )
                                        })}
                                    </span>
                                    <span>
                                        <span className={`${SERIF} block text-[18px] font-semibold lg:text-[22px]`}>{gn.nome}</span>
                                        <span className="mt-1 hidden text-[12px] font-semibold text-accent lg:block">Ver gênero →</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ── Todas as produções ── */}
            <section className="page-wrap pt-10" data-bloco="lista-todas">
                <div className="flex flex-col gap-1 border-b border-border sm:flex-row sm:items-end sm:justify-between">
                    <h2 className={`${H2} sm:order-2 sm:pb-3`}>Todas as produções</h2>
                    <div className="-mx-4 flex gap-6 overflow-x-auto px-4 sm:order-1 sm:mx-0 sm:px-0" role="group" aria-label="Ordenar">
                        <Link href={buildHref({ order: 'trending', page: '1' })} className={aba(currentOrder === 'trending')}>Em alta</Link>
                        <Link href={buildHref({ order: 'recent', page: '1' })} className={aba(currentOrder === 'recent')}>Mais recentes</Link>
                        <Link href={buildHref({ order: 'az', page: '1' })} className={aba(currentOrder === 'az')}>A–Z</Link>
                    </div>
                </div>
                <div className="py-6 sm:py-7">
                    {grade.length === 0 ? (
                        <EmptyState
                            icon={<Film size={48} />}
                            title="Nenhuma produção encontrada"
                            description={search ? `Nenhum resultado para "${search}"` : 'Sem produções disponíveis'}
                            actionHref="/productions"
                            actionLabel="Ver todas"
                        />
                    ) : (
                        // Fatias de 12 (divide 2, 3, 4 e 6 colunas) com o anúncio entre elas, fora da grade, para não deixar órfãos.
                        (() => {
                            const CORTE = 12
                            const temAnuncio = !!ADSENSE.slots.inline && grade.length >= CORTE + 6
                            const blocos = temAnuncio ? [grade.slice(0, CORTE), grade.slice(CORTE)] : [grade]
                            let offset = 0
                            return blocos.map((bloco, b) => {
                                const inicioBloco = offset
                                offset += bloco.length
                                return (
                                    <Fragment key={b}>
                                        {b > 0 && <div className="my-6"><AdSlotInline slot={ADSENSE.slots.inline!} layout="feed" analyticsPlacement="productions_grid_1" /></div>}
                                        <div data-bloco="listagem-producoes" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 xl:grid-cols-6">
                                            {bloco.map((p, i) => (
                                                <ProductionCard key={p.id} production={p} priority={!inicio && inicioBloco + i < 2} variant="catalog" genreMap={genreMap} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px" />
                                            ))}
                                        </div>
                                    </Fragment>
                                )
                            })
                        })()
                    )}
                    {proximaPagina && (
                        <div className="mt-8 flex justify-center">
                            <Link href={proximaPagina} className="touch-target inline-flex h-12 items-center border border-accent px-7 text-[15px] font-bold text-accent hover:bg-accent/10">
                                Ver mais {numero(restantes)} {restantes === 1 ? 'produção' : 'produções'}
                            </Link>
                        </div>
                    )}
                    <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={p => buildHref({ page: String(p) })} />
                </div>
            </section>
        </>
    )
}

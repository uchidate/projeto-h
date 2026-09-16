import Link from 'next/link'
import { Fragment } from 'react'
import { Film } from 'lucide-react'
import type { WPProduction, WPTerm } from '@/lib/wordpress/types'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { ProductionsFilterSelects } from '@/components/features/ProductionsFilterSelects'
import { ProductionCard } from '@/components/productions/ProductionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { CatalogIntro } from '@/components/ui/CatalogIntro'
import { RastreioDeFiltros } from '@/components/analytics/RastreioDeFiltros'

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
}

const chip = (active: boolean) =>
    `inline-flex h-8 shrink-0 items-center rounded-md px-3 text-[12px] font-bold transition-colors ${
        active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
    }`

export function ProductionsPage({
    productions, total, totalPages, genres, platforms,
    currentPage, currentGenre, currentPlatform, currentType, currentOrder = 'trending', search,
}: Props) {
    const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))
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

    return (
        <>
            {/* Chaves iguais ao SearchParams de app/(site)/productions/page.tsx. */}
            <RastreioDeFiltros listagem="producoes" filtros={['genre', 'platform', 'type', 'order', 'page', 'search']} />
            <ResponsiveFilterBar label="Filtros" value="Produções">
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-2 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">

                        {/* TIPO */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Tipo</span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                <Link href={buildHref({ type: undefined, genre: undefined, platform: undefined, page: '1' })} className={chip(!currentType)}>Todos</Link>
                                <Link href={buildHref({ type: 'drama', page: '1' })} className={chip(currentType === 'drama')}>Doramas</Link>
                                <Link href={buildHref({ type: 'movie', page: '1' })} className={chip(currentType === 'movie')}>Filmes</Link>
                                <Link href={buildHref({ type: 'special', page: '1' })} className={chip(currentType === 'special')}>Especiais</Link>
                                <Link href={buildHref({ type: 'variety', page: '1' })} className={chip(currentType === 'variety')}>Variety</Link>
                            </div>
                        </div>

                        {/* ORDEM */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Ordem</span>
                            <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                                <Link href={buildHref({ order: 'trending', page: '1' })} className={chip(!currentOrder || currentOrder === 'trending')}>Em alta</Link>
                                <Link href={buildHref({ order: 'recent', page: '1' })} className={chip(currentOrder === 'recent')}>Mais recentes</Link>
                                <Link href={buildHref({ order: 'az', page: '1' })} className={chip(currentOrder === 'az')}>A-Z</Link>
                            </div>
                        </div>

                        {/* GÊNERO e PLATAFORMA — client component (usa router) */}
                        <ProductionsFilterSelects
                            genres={genres}
                            platforms={platforms}
                            currentGenre={currentGenre}
                            currentPlatform={currentPlatform}
                        />
                    </div>

                    <SearchInput placeholder="Buscar produção..." current={search} className="lg:ml-auto" />
                </div>
            </ResponsiveFilterBar>
            <CatalogIntro
                title="Doramas, filmes e séries coreanas"
                description="Produções para descobrir por formato, gênero e plataforma, com informações organizadas em português."
                count={total}
                countLabel="produções no catálogo"
            />
        <div className="page-wrap py-10">

            {productions.length === 0 ? (
                <EmptyState
                    icon={<Film size={48} />}
                    title="Nenhuma produção encontrada"
                    description={search ? `Nenhum resultado para "${search}"` : 'Sem produções disponíveis'}
                    actionHref="/productions"
                    actionLabel="Ver todas"
                />
            ) : (
                /* Célula vazia no fim da linha é aritmética. A página traz 24 itens,
                   então toda contagem de coluna precisa dividir 24: 2, 3, 4 e 6. O
                   breakpoint lg de 5 colunas saía (24÷5 deixava 4 buracos), e o salto
                   md:4 → xl:6 já era o comportamento em telas médias.

                   Os anúncios eram `col-span-full` dentro da grade, nos itens 6 e 18,
                   partindo a linha no corte — 2 órfãs em 4 colunas. Com colunas
                   {2,3,4,6} o único corte interno que fecha toda linha é o 12, o que
                   comportaria só um anúncio. Para não perder inventário, o primeiro vai
                   entre duas grades de 12 e o segundo desce para depois da grade, onde
                   não parte nada. Continuam duas unidades. */
                <>
                    {(() => {
                        const CORTE = 12
                        const temAnuncio = !!ADSENSE.slots.inline && productions.length >= CORTE * 2
                        const blocos = temAnuncio ? [productions.slice(0, CORTE), productions.slice(CORTE)] : [productions]
                        let offset = 0
                        return blocos.map((bloco, b) => {
                            const inicio = offset
                            offset += bloco.length
                            return (
                                <Fragment key={b}>
                                    {b > 0 && (
                                        <div className="my-6">
                                            <AdSlotInline slot={ADSENSE.slots.inline!} layout="feed" analyticsPlacement="productions_grid_1" />
                                        </div>
                                    )}
                                    <div data-bloco="listagem-producoes" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
                                        {bloco.map((p, i) => (
                                            <ProductionCard key={p.id} production={p} priority={inicio + i < 2} variant="catalog" genreMap={genreMap} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px" />
                                        ))}
                                    </div>
                                </Fragment>
                            )
                        })
                    })()}
                    {ADSENSE.slots.inline && (
                        <div className="mt-8">
                            <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="productions_grid_2" />
                        </div>
                    )}
                </>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={p => buildHref({ page: String(p) })} />
        </div>
        </>
    )
}

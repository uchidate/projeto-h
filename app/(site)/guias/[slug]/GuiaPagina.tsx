import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { stripHtml } from '@/lib/utils'
import { SITE_URL, compartilhamento } from '@/lib/constants/site'
import { getAllHubs, getHub, getRelatedHubs, rotuloDoGuia } from '@/lib/guias'
import { findAgencyId, getHubItems } from '@/lib/guias/hub-items'
import { getGroups } from '@/lib/wordpress/groups'
import { GruposDaAgencia } from '@/components/guias/GruposDaAgencia'
import { SolistaDestaque } from '@/components/guias/SolistaDestaque'
import { GrupoDestaque } from '@/components/guias/GrupoDestaque'
import { DestaquesDaCategoria } from '@/components/guias/DestaquesDaCategoria'
import { getArtists } from '@/lib/wordpress/artists'
import { getAgencyById } from '@/lib/wordpress/agencies'
import { getPosts } from '@/lib/wordpress/posts'
import { getProductionGenres } from '@/lib/wordpress/productions'
import { getVitrineGeral, getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import { getStoreProductsByArtistId, getStoreProductsByGroupId } from '@/lib/wordpress/store'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { HubPageContent } from '@/components/features/HubPageContent'

export type SearchParamsGuia = Record<string, string | string[] | undefined>

export async function buildGuiaMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const hub = await getHub(slug)
    if (!hub) return {}
    const url = `${SITE_URL}/guias/${slug}`
    return {
        title: hub.title,
        description: hub.description,
        keywords: hub.keywords,
        alternates: { canonical: url },
        ...compartilhamento({ titulo: hub.title, descricao: hub.description, caminho: `/guias/${slug}` }),
    }
}

/** Chaves de query que mudam o conteúdo do guia (filtros e paginação). */
export const CHAVES_FILTRO_GUIA = ['page', 'genre', 'platform', 'network', 'type', 'year'] as const

export async function GuiaPagina({ slug, sp }: { slug: string; sp: SearchParamsGuia }) {
    const hub = await getHub(slug)
    if (!hub) notFound()

    const page    = Math.max(1, Number(sp.page ?? 1) || 1)
    const genre   = typeof sp.genre    === 'string' ? sp.genre    : undefined
    const platform= typeof sp.platform === 'string' ? sp.platform : undefined
    const network = typeof sp.network  === 'string' ? sp.network  : undefined
    const type    = typeof sp.type     === 'string' ? sp.type     : undefined
    const year    = typeof sp.year     === 'string' ? Number(sp.year) || undefined : undefined

    // Guia de dorama/filme/série pede comida e K-beauty; os demais, itens de K-pop.
    const tipoVitrine = /dorama|drama|filme|serie|netflix|novela|romance|thriller|terror|comedia|acao/.test(slug) ? 'drama' : 'kpop'
    // Guia de integrantes de um grupo: o grupo abre a página.
    const grupoSlug = hub.kind === 'artists' && !hub.filter.artistSlug ? hub.filter.groupSlug : undefined
    const [relatedHubs, todosGuias, result, { items: blogPosts }, genres, grupoGuia] = await Promise.all([
        getRelatedHubs(hub),
        getAllHubs(),
        getHubItems(hub, { page, genre, platform, network, type, year }),
        hub.filter.artistSlug
            ? getPosts({ mentionsType: 'artist', mentionsSlug: hub.filter.artistSlug, perPage: 3, includeContent: false })
            : grupoSlug
                ? getPosts({ mentionsType: 'group', mentionsSlug: grupoSlug, perPage: 3, includeContent: false })
                : getPosts({ search: hub.keywords[0], perPage: 3, includeContent: false }),
        getProductionGenres(),
        grupoSlug ? getGroups({ slug: grupoSlug, perPage: 1 }).then(r => r.items[0]).catch(() => undefined) : Promise.resolve(undefined),
    ])
    // "Comece por aqui": só na primeira página, sem filtro ativo. Sai da própria página de resultados,
    // mantendo a ordem de tendência e exigindo nota decente (10,0 fica de fora: com poucos votos, a nota máxima vem de meia dúzia de avaliações). Não reordena por nota: acf.rating é o
    // vote_average do TMDB sem mínimo de votos, e títulos com poucos votos chegam a 9,7.
    const semFiltro = page === 1 && !genre && !platform && !network && !type && !year
    const destaques = result.kind === 'productions' && semFiltro
        ? result.items
            .filter(p => { const nota = Number(p.acf?.rating ?? 0); return nota >= 7.5 && nota < 9.8 })
            .slice(0, 6)
        : []
    // Guia de agência: os grupos vêm antes da grade de artistas (ordem de popularidade; grupo sem leitura fica no fim).
    let gruposDaAgencia: Awaited<ReturnType<typeof getGroups>>['items'] = []
    if (hub.kind === 'artists' && hub.filter.agencyName && semFiltro) {
        const agencyId = await findAgencyId(hub.filter.agencyName)
        if (agencyId) gruposDaAgencia = (await getGroups({ agency: agencyId, perPage: 24, orderby: 'popularity', order: 'desc' }).catch(() => ({ items: [] }))).items
        if (gruposDaAgencia.length === 0 && agencyId) gruposDaAgencia = (await getGroups({ agency: agencyId, perPage: 24, orderby: 'title', order: 'asc' }).catch(() => ({ items: [] }))).items
    }
    // Guia de um artista: ele abre a página e a lista traz só os demais nomes (do grupo, se houver).
    const solista = result.kind === 'artists' && hub.filter.artistSlug ? result.items.find(a => a.slug === hub.filter.artistSlug) : undefined
    const demaisDoSolista = solista && result.kind === 'artists' ? result.items.filter(a => a.id !== solista.id) : undefined
    const resumoDoSolista = solista ? hub.description.replace(/^Perfil completo d[eo] [^:]+:\s*/i, '').replace(/^./, c => c.toUpperCase()) : undefined
    const agenciaDoGrupo = grupoGuia?.acf?.agency ? (await getAgencyById(grupoGuia.acf.agency).catch(() => null))?.title.rendered : undefined
    const exIntegrantes = ((grupoGuia as { former_member_slugs?: string[] } | undefined)?.former_member_slugs ?? []).map(x => x.split('|')[1] ?? x.split('|')[0].replace(/-/g, ' '))
    const integrantesDoGrupo = result.kind === 'artists' ? result.items.length : 0
    // Guia por categoria (cantoras, atores, idols): os 12 de maior peso abrem a página, antes da lista alfabética.
    const f = hub.filter
    const destaquesDaCategoria = hub.kind === 'artists' && f.role && !f.agencyName && !f.groupSlug && !f.artistSlug && semFiltro
        ? (await getArtists({ role: f.role, gender: f.gender, perPage: 12, orderby: 'popularity', order: 'desc' }).catch(() => ({ items: [] }))).items
        : []
    // Vitrine pelo assunto do guia (palavras do título, das palavras-chave e dos grupos da agência no nome do produto).
    // Sem casamento, cai na vitrine geral do tipo.
    // Palavras genéricas ficam fora: "doramas" e "coreanos" casariam caneca e macarrão em qualquer guia de produção.
    const GENERICAS = /\b(doramas?|k-?dramas?|kdramas?|coreanas?|coreanos?|filmes?|series?|séries?|guia|artistas?|grupos?|kpop|k-pop|melhores|famosos?|famosas?)\b/gi
    const termosDoGuia = [hub.title, hub.shortTitle, ...hub.keywords, ...gruposDaAgencia.map(g => g.title.rendered)]
        .map(t => t.replace(GENERICAS, ' ').replace(/\s+/g, ' ').trim()).filter(t => t.length > 2)
    // Guia de produção fica com a vitrine geral de drama: o casamento por palavra só acerta nomes próprios (artista, grupo),
    // e no gênero trazia caneca e kit facial por coincidência de termo.
    let shopProducts: Awaited<ReturnType<typeof getVitrineGeral>> = []
    let tematica = false
    if (grupoGuia) {
        // Guia de um grupo: produtos do grupo e de integrantes; sem eles, a faixa some em vez de mostrar outro grupo.
        const integrantes = result.kind === 'artists' ? result.items.slice(0, 4) : []
        const listas = await Promise.all([getStoreProductsByGroupId(grupoGuia.id), ...integrantes.map(a => getStoreProductsByArtistId(a.id))].map(p => p.catch(() => [])))
        const intercalados = Array.from({ length: Math.max(0, ...listas.map(l => l.length)) }, (_, i) => listas.map(l => l[i]).filter(Boolean)).flat()
        shopProducts = [...new Map(intercalados.map(p => [p.id, p])).values()].slice(0, 6)
        tematica = true
    } else if (solista) {
        // Guia de um artista: só produto do próprio artista e do grupo; sem eles, a faixa some em vez de mostrar outro grupo.
        const nomes = [solista, ...(demaisDoSolista ?? []).slice(0, 3)]
        const listas = await Promise.all(nomes.map(a => getStoreProductsByArtistId(a.id).catch(() => [])))
        const intercalados = Array.from({ length: Math.max(0, ...listas.map(l => l.length)) }, (_, i) => listas.map(l => l[i]).filter(Boolean)).flat()
        shopProducts = [...new Map(intercalados.map(p => [p.id, p])).values()].slice(0, 6)
        tematica = true
    } else {
        shopProducts = hub.kind === 'productions' ? [] : await getVitrinePorTermos(termosDoGuia, `guia:${slug}`, { limit: 6 }).catch(() => [])
        tematica = shopProducts.length >= 3
        if (!tematica) shopProducts = await getVitrineGeral(`guia:${slug}`, 6, tipoVitrine)
    }
    const genreMap = Object.fromEntries(genres.map(g => [g.id, { name: g.name, slug: g.slug }]))
    const perPage = 48
    const totalPages = Math.ceil(result.total / perPage)

    return (
        <Suspense>
            <HubPageContent
                hub={hub}
                relatedHubs={relatedHubs}
                rotulo={rotuloDoGuia(hub.slug)}
                abertura={grupoGuia ? <GrupoDestaque group={grupoGuia} agencia={agenciaDoGrupo} exIntegrantes={exIntegrantes} integrantes={integrantesDoGrupo} /> : solista ? <SolistaDestaque artist={solista} grupo={demaisDoSolista?.length ? 'do grupo' : undefined} resumo={resumoDoSolista} /> : destaquesDaCategoria.length > 0 ? <DestaquesDaCategoria artists={destaquesDaCategoria} rotulo={hub.shortTitle} /> : gruposDaAgencia.length > 0 ? <GruposDaAgencia agencia={hub.shortTitle} grupos={gruposDaAgencia} /> : undefined}
                introDepois={!!solista || !!grupoGuia}
                semLista={!!solista && demaisDoSolista?.length === 0}
                listaTitulo={solista ? { eyebrow: `${demaisDoSolista?.length ?? 0} artistas`, title: 'Do mesmo grupo' } : grupoGuia ? { eyebrow: `${integrantesDoGrupo} integrantes`, title: 'Integrantes' } : destaquesDaCategoria.length > 0 ? { eyebrow: `${result.total} artistas`, title: 'Todos, de A a Z' } : undefined}
                itensBusca={todosGuias.map(h => ({ rotulo: h.shortTitle, href: `/guias/${h.slug}`, tipo: h.kind === 'productions' ? 'Produções' : h.kind === 'artists' ? 'Artistas' : 'Grupos', palavras: h.keywords.join(' ') }))}
                total={demaisDoSolista ? demaisDoSolista.length : result.total}
                productions={result.kind === 'productions' ? result.items : undefined}
                artists={result.kind === 'artists' ? (demaisDoSolista ?? result.items) : undefined}
                groups={result.kind === 'groups' ? result.items : undefined}
                blogPosts={blogPosts}
                lojaMeio={<LojaEmLinha bloco="guia-loja-meio" products={shopProducts} title={tematica ? `Na loja: ${grupoGuia ? stripHtml(grupoGuia.title.rendered) : solista ? stripHtml(solista.title.rendered) : hub.shortTitle}` : tipoVitrine === 'drama' ? 'Para quem curte k-drama' : 'Para quem curte k-pop'} contexto={`guia:${slug}:meio`} />}
                quiz={<QuizWidget category={tipoVitrine === 'drama' ? 'k-drama' : 'k-pop'} />}
                destaques={destaques}
                genreMap={genreMap}
                siteUrl={SITE_URL}
                page={page}
                totalPages={totalPages}
                activeFilters={{ genre, platform, network, type: type ?? hub.filter.type, year: year?.toString() }}
            />
        </Suspense>
    )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { HomeFrontPage } from '@/components/home/HomeFrontPage'
import { IS_BUILD } from '@/lib/wordpress/config'
import { carregarHome } from '@/lib/home/carregar-home'
import { PerguntaDoDiaServer } from '@/components/quiz/PerguntaDoDiaServer'
import { fetchCatalog, type CatalogKind } from '@/components/features/LocalizedCatalog'


const SECOES = ['groups', 'artists', 'productions'] as const satisfies readonly CatalogKind[]

const MIN_ARTIGOS_TRADUZIDOS = 3

async function carregarSecoes(locale: Locale) {
    const resultados = await Promise.all(SECOES.map((kind) => fetchCatalog(kind, locale, 1)))
    return SECOES.map((kind, i) => ({ kind, ...resultados[i] })).filter((secao) => secao.total > 0)
}

export async function generateMetadataHomeIntl(locale: Locale): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'entity.home' })
    const url = `${SITE_URL}${href('home', undefined, locale)}`
    const vazia = (await carregarSecoes(locale)).length === 0
    // Todas as versões com conteúdo se apontam entre si (recíproco): o seletor do cabeçalho lê essas tags,
    // e com só PT + o idioma atual o /es não oferecia o /en (nem o contrário).
    const outras = ACTIVE_LOCALES.filter((l) => l !== DEFAULT_LOCALE && l !== locale)
    const comConteudo = (await Promise.all(outras.map(async (l) => ((await carregarSecoes(l)).length > 0 ? l : null)))).filter((l): l is Locale => l !== null)
    return {
        title: { absolute: t('title') },
        description: t('description'),
        alternates: {
            canonical: url,
            ...(vazia ? {} : {
                languages: {
                    [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/`,
                    [LOCALE_META[locale].htmlLang]: url,
                    ...Object.fromEntries(comConteudo.map((l) => [LOCALE_META[l].htmlLang, `${SITE_URL}${href('home', undefined, l)}`])),
                    'x-default': `${SITE_URL}/`,
                },
            }),
        },
        // Sem nenhuma ficha publicada no idioma, a pagina seria rasa.
        ...(vazia ? { robots: { index: false, follow: true } } : {}),
        openGraph: { ...baseOG(url), locale: LOCALE_META[locale].ogLocale, title: t('title'), description: t('description') },
        twitter: baseTwitter(),
    }
}

/**
 * Home de um idioma além do português: a mesma `HomeFrontPage` da home PT, com a
 * interface traduzida e sem os blocos só-PT (loja, streaming BR).
 * Só aparecem artigos com tradução publicada (mínimo de 3, senão a seção some); nada além da home em si.
 */
export async function HomeIntl({ locale }: { locale: Locale }) {
    const dados = await carregarHome({ comercio: false, locale })

    // Mesma guarda da home PT, mas pelas produções: artigo traduzido pode não existir ainda, produção sempre existe.
    if (!IS_BUILD && dados.productions.length === 0) {
        throw new Error('Home sem produções — WordPress indisponível; não cachear esta renderização')
    }
    // Poucos artigos traduzidos deixariam as vitrines quase vazias: abaixo do mínimo a seção some e o hero vira uma produção.
    const posts = dados.posts.length >= MIN_ARTIGOS_TRADUZIDOS ? dados.posts : []

    return (
        <>
            <HomeFrontPage
                locale={locale}
                posts={posts}
                productions={dados.productions}
                artists={dados.artists}
                spotlightArtists={dados.spotlightArtists}
                featuredArtist={dados.featuredSpotlight?.artist ?? null}
                featuredArtistNote={dados.featuredSpotlight?.note ?? ''}
                trendingGroups={dados.trendingGroupsList}
                homeSettings={dados.siteSettings.home}
                streamingByPlatform={dados.streamingByPlatform}
                categoryMap={dados.categoryMap}
                cultureGuides={dados.passos}
                postsEditorias={dados.postsEditorias}
                capasAlbum={dados.capasAlbum}
                producoesEmAlta={dados.producoesEmAlta}
                produtosMaisVendidos={dados.produtosMaisVendidos}
                aniversarios={dados.aniversarios}
                hoje={dados.hoje}
                temas={dados.temas}
                explore={dados.explore}
                guiasPorTema={dados.guiasPorTema}
                pergunta={<Suspense fallback={null}><PerguntaDoDiaServer locale={locale} /></Suspense>}
            />
        </>
    )
}

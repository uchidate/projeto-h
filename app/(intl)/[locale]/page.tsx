import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_META, isActiveLocale, type Locale } from '@/lib/i18n/config'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { href } from '@/lib/i18n/routes'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { HomeFrontPage } from '@/components/home/HomeFrontPage'
import { IS_BUILD } from '@/lib/wordpress/config'
import { carregarHome } from '@/lib/home/carregar-home'
import { EntityGrid, fetchCatalog, type CatalogKind } from '@/components/features/LocalizedCatalog'

export const revalidate = 600

type Params = Promise<{ locale: string }>

const SECOES: CatalogKind[] = ['groups', 'artists', 'productions']
const POR_SECAO = 12

async function carregarSecoes(locale: Locale) {
    const resultados = await Promise.all(SECOES.map((kind) => fetchCatalog(kind, locale, 1)))
    return SECOES.map((kind, i) => ({ kind, ...resultados[i] })).filter((secao) => secao.total > 0)
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    const t = await getTranslations({ locale, namespace: 'entity.home' })
    const url = `${SITE_URL}${href('home', undefined, locale)}`
    const vazia = (await carregarSecoes(locale)).length === 0
    return {
        title: { absolute: t('title') },
        description: t('description'),
        alternates: {
            canonical: url,
            ...(vazia ? {} : {
                languages: {
                    [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/`,
                    [LOCALE_META[locale].htmlLang]: url,
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
 * interface traduzida e sem os blocos só-PT (hubs, loja, streaming BR, quiz).
 * Os artigos aparecem com selo "PT" e abrem no original. Abaixo ficam as fichas
 * já traduzidas e publicadas, que são o conteúdo indexável da página.
 */
export default async function IntlHomePage({ params }: { params: Params }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    const [t, tc, secoes, dados] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.home' }),
        getTranslations({ locale, namespace: 'entity.catalog' }),
        carregarSecoes(locale),
        carregarHome({ comercio: false }),
    ])

    // Mesma guarda da home PT: sem posts o WordPress falhou, e a versão degradada não pode ser cacheada.
    if (!IS_BUILD && dados.posts.length === 0) {
        throw new Error('Home sem posts — WordPress indisponível; não cachear esta renderização')
    }

    return (
        <>
            <HomeFrontPage
                locale={locale}
                posts={dados.posts}
                productions={dados.productions}
                artists={dados.artists}
                spotlightArtists={dados.spotlightArtists}
                featuredArtist={dados.featuredSpotlight?.artist ?? null}
                featuredArtistNote={dados.featuredSpotlight?.note ?? ''}
                trendingGroups={dados.trendingGroupsList}
                homeSettings={dados.siteSettings.home}
                streamingByPlatform={dados.streamingByPlatform}
                categoryMap={dados.categoryMap}
                featuredProducts={dados.featuredProducts}
            />
            <div className="page-wrap py-10 sm:py-14">
                <header className="mb-8 border-b-2 border-foreground pb-6">
                    <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-accent">{t('eyebrow')}</p>
                    <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-foreground/75">{t('intro')}</p>
                </header>

                {secoes.length === 0 && (
                    <p className="text-[15px] text-muted">
                        {tc('empty')}{' '}
                        <Link href="/" hrefLang={LOCALE_META[DEFAULT_LOCALE].htmlLang} className="font-semibold text-accent hover:underline">{t('ptLink')} →</Link>
                    </p>
                )}

                <div className="space-y-12">
                    {secoes.map((secao) => (
                        <section key={secao.kind} aria-labelledby={`secao-${secao.kind}`}>
                            <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
                                <h2 id={`secao-${secao.kind}`} className="text-[22px] font-black tracking-[-0.02em] sm:text-[28px]">
                                    {t(`sections.${secao.kind}`)}
                                </h2>
                                <Link href={href(secao.kind, undefined, locale)} className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent hover:underline">
                                    {t('seeAll', { count: secao.total })} →
                                </Link>
                            </div>
                            <EntityGrid items={secao.items} kind={secao.kind} locale={locale} limite={POR_SECAO} />
                        </section>
                    ))}
                </div>

                {secoes.length > 0 && (
                    <p className="mt-14 border-t border-border pt-6 text-[14px] text-muted">
                        <Link href="/" hrefLang={LOCALE_META[DEFAULT_LOCALE].htmlLang} className="font-semibold text-foreground hover:text-accent">{t('ptLink')} →</Link>
                    </p>
                )}
            </div>
        </>
    )
}

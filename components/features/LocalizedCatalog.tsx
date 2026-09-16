import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { getProductions } from '@/lib/wordpress/productions'
import type { WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { href } from '@/lib/i18n/routes'
import { labelsFor } from '@/lib/i18n/labels'

/**
 * Listagem de fichas em idioma diferente do português — D2/D7 em
 * docs/I18N-ARQUITETURA.md.
 *
 * Não reaproveita as listagens de `(site)`: elas têm filtros (letra, papel,
 * geração, gênero, plataforma) pensados para milhares de itens. O catálogo
 * traduzido começa com dezenas; os mesmos filtros gerariam páginas vazias e
 * rasas. Aqui só há paginação, e só entram fichas com tradução publicada.
 */
export type CatalogKind = 'artists' | 'groups' | 'productions'

const PER_PAGE = 48
const DETAIL_ROUTE = { artists: 'artist', groups: 'group', productions: 'production' } as const


type Entity = WPArtist | WPGroup | WPProduction

export async function fetchCatalog(kind: CatalogKind, locale: Locale, page: number) {
    const query = { page, perPage: PER_PAGE, locale, orderby: 'title' as const, order: 'asc' as const }
    const result: { items: Entity[]; total: number; totalPages: number } =
        kind === 'artists' ? await getArtists(query)
            : kind === 'groups' ? await getGroups(query)
                : await getProductions({ ...query, excludeAdult: true })
    // Defesa em profundidade: se `oc_locale` ainda não existir no WordPress, o
    // parâmetro é ignorado e viria o catálogo inteiro em português.
    const items = result.items.filter((item) => hasLocale(item, locale)).map((item) => localizeEntity(item, locale, DETAIL_ROUTE[kind]))
    const filtered = items.length !== result.items.length
    return {
        items,
        total: filtered ? items.length : result.total,
        totalPages: filtered ? Math.min(1, items.length) : result.totalPages,
    }
}

function parsePage(value?: string) {
    return Math.max(1, parseInt(value ?? '1', 10) || 1)
}

function pageUrl(kind: CatalogKind, locale: Locale, page: number) {
    const base = `${SITE_URL}${href(kind, undefined, locale)}`
    return page > 1 ? `${base}?page=${page}` : base
}

/**
 * hreflang da listagem em português para as versões em outros idiomas — só as
 * que têm itens (a versão vazia é `noindex` e não deve ser apontada).
 */
export async function defaultCatalogLanguages(kind: CatalogKind): Promise<Record<string, string> | undefined> {
    const others = ACTIVE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE)
    if (others.length === 0) return undefined
    const withItems = (await Promise.all(others.map(async (locale) => ((await fetchCatalog(kind, locale, 1)).total > 0 ? locale : null))))
        .filter((locale): locale is Locale => locale !== null)
    if (withItems.length === 0) return undefined
    const pt = `${SITE_URL}${href(kind)}`
    return Object.fromEntries([
        [LOCALE_META[DEFAULT_LOCALE].htmlLang, pt],
        ...withItems.map((locale) => [LOCALE_META[locale].htmlLang, pageUrl(kind, locale, 1)]),
        ['x-default', pt],
    ])
}

export async function buildCatalogMetadata(kind: CatalogKind, locale: Locale, pageParam?: string): Promise<Metadata> {
    const page = parsePage(pageParam)
    const [t, { total, totalPages }] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.catalog' }),
        fetchCatalog(kind, locale, page),
    ])
    const url = pageUrl(kind, locale, page)
    // Listagem vazia ou página fora do total não merece índice.
    const thin = total === 0 || page > Math.max(1, totalPages)
    return {
        title: t(`${kind}.title`),
        description: t(`${kind}.description`),
        alternates: {
            canonical: url,
            ...(page === 1 && !thin ? {
                languages: {
                    [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}${href(kind)}`,
                    [LOCALE_META[locale].htmlLang]: url,
                    'x-default': `${SITE_URL}${href(kind)}`,
                },
            } : {}),
        },
        ...(thin ? { robots: { index: false, follow: true } } : {}),
        openGraph: { ...baseOG(url), locale: LOCALE_META[locale].ogLocale },
        twitter: baseTwitter(),
    }
}

/** Grade de fichas: a mesma no catalogo e na home em outro idioma. */
export function EntityGrid({ items, kind, locale, limite }: { items: Entity[]; kind: CatalogKind; locale: Locale; limite?: number }) {
    const labels = labelsFor(locale)

    const subtitle = (item: Entity): string | undefined => {
        const acf = (item.acf ?? {}) as Record<string, unknown>
        if (kind === 'artists') return (acf.roles as string[] | undefined)?.slice(0, 2).map(labels.role).join(' · ')
        if (kind === 'groups') return typeof acf.type === 'string' ? labels.groupType(acf.type) : undefined
        const type = typeof acf.type === 'string' ? labels.productionType(acf.type === 'drama' ? 'dramaDisplay' : acf.type) : undefined
        return [type, acf.year].filter(Boolean).join(' · ')
    }
    return (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {(limite ? items.slice(0, limite) : items).map((item) => {
                const name = stripHtml(item.title.rendered)
                const image = getWPImage(undefined, item.featured_image_url, name)
                const detail = (href as (r: string, p: unknown, l: Locale) => string)(DETAIL_ROUTE[kind], { slug: item.slug }, locale)
                const meta = subtitle(item)
                return (
                    <li key={item.id}>
                        <Link href={detail} className="group block">
                            <div className={`relative overflow-hidden bg-surface ${kind === 'productions' ? 'aspect-2/3' : 'aspect-3/4'}`}>
                                {image && (
                                    <Image src={image.src} alt={image.alt || name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                )}
                            </div>
                            <p className="mt-2 text-[14px] font-bold leading-tight transition-colors group-hover:text-accent">{name}</p>
                            {meta && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{meta}</p>}
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

export async function LocalizedCatalog({ kind, locale, pageParam }: { kind: CatalogKind; locale: Locale; pageParam?: string }) {
    const page = parsePage(pageParam)
    const [t, { items, total, totalPages }] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.catalog' }),
        fetchCatalog(kind, locale, page),
    ])
    if (total > 0 && page > totalPages) notFound()
    return (
        <div className="page-wrap py-10 sm:py-14">
            <header className="mb-8 border-b border-border pb-6">
                <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] sm:text-[44px]">{t(`${kind}.title`)}</h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70">{t(`${kind}.description`)}</p>
                {total > 0 && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t('count', { count: total })}</p>}
            </header>

            {items.length === 0 ? (
                <p className="text-[15px] text-muted">
                    {t('empty')}{' '}
                    <Link href={href(kind)} hrefLang={LOCALE_META[DEFAULT_LOCALE].htmlLang} className="font-semibold text-accent hover:underline">
                        {t('emptyLink')} →
                    </Link>
                </p>
            ) : (
                <EntityGrid items={items} kind={kind} locale={locale} />
            )}

            {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-between border-t border-border pt-4 font-mono text-[12px]" aria-label={t('pageOf', { page, total: totalPages })}>
                    {page > 1 ? <Link href={pageUrl(kind, locale, page - 1).replace(SITE_URL, '')} className="hover:text-accent">{t('previous')}</Link> : <span />}
                    <span className="text-muted">{t('pageOf', { page, total: totalPages })}</span>
                    {page < totalPages ? <Link href={pageUrl(kind, locale, page + 1).replace(SITE_URL, '')} className="hover:text-accent">{t('next')}</Link> : <span />}
                </nav>
            )}
        </div>
    )
}

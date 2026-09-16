import { getAllHubs } from '@/lib/guias'
import { SITE_URL } from '@/lib/constants/site'
import { buildParams, wpFetchWithTotal } from '@/lib/wordpress/client'
import { WP_CACHE_TAGS } from '@/lib/wordpress/cache'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, isActiveLocale, type Locale } from '@/lib/i18n/config'

export const SITEMAP_SHARDS = [
    'pages',
    'productions',
    'artists',
    'groups',
    'agencies',
    'foods',
    'companies',
    'posts',
] as const

export type SitemapShard = (typeof SITEMAP_SHARDS)[number]
type SitemapEntry = { loc: string; lastmod?: string; alternates?: Record<string, string> }
type WPEntry = { slug: string; date?: string; modified?: string; translations?: Record<string, unknown> | null }

/**
 * Shards com versão em outros idiomas — docs/I18N-ARQUITETURA.md (D7). O
 * arquivo é `<shard>-<locale>.xml` e só lista fichas com tradução publicada.
 */
export const LOCALIZED_SHARDS = ['artists', 'groups', 'productions'] as const
type LocalizedShard = (typeof LOCALIZED_SHARDS)[number]

function localizedSitemapLocales(): Locale[] {
    return ACTIVE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE)
}

const COLLECTIONS: Partial<Record<SitemapShard, {
    restBase: string
    publicBase: string
    tag: string
}>> = {
    productions: { restBase: 'production', publicBase: 'productions', tag: WP_CACHE_TAGS.productions },
    artists: { restBase: 'artist', publicBase: 'artists', tag: WP_CACHE_TAGS.artists },
    groups: { restBase: 'group', publicBase: 'groups', tag: WP_CACHE_TAGS.groups },
    agencies: { restBase: 'agency', publicBase: 'agencies', tag: WP_CACHE_TAGS.agencies },
    foods: { restBase: 'food', publicBase: 'comidas', tag: WP_CACHE_TAGS.foods },
    companies: { restBase: 'company', publicBase: 'empresas', tag: WP_CACHE_TAGS.companies },
    posts: { restBase: 'posts', publicBase: 'blog', tag: WP_CACHE_TAGS.posts },
}

const STATIC_PAGES = [
    '', 'productions', 'artists', 'groups', 'groups/boy-groups',
    'groups/girl-groups', 'groups/grupos-mistos', 'groups/solos',
    'agencies', 'blog', 'guias', 'about', 'contato', 'privacidade', 'termos',
]

export function isSitemapShard(value: string): value is SitemapShard {
    return (SITEMAP_SHARDS as readonly string[]).includes(value)
}

/** `artists-en` → `{ shard: 'artists', locale: 'en' }`; só idiomas ativos. */
export function resolveLocalizedShard(value: string): { shard: LocalizedShard; locale: Locale } | null {
    const match = value.match(/^([a-z]+)-([a-z]{2})$/)
    if (!match) return null
    const [, shard, locale] = match
    if (!(LOCALIZED_SHARDS as readonly string[]).includes(shard)) return null
    if (locale === DEFAULT_LOCALE || !isActiveLocale(locale)) return null
    return { shard: shard as LocalizedShard, locale }
}

export function resolveSitemapShard(value: string): SitemapShard | null {
    if (isSitemapShard(value)) return value
    if (value === 'agencys') return 'agencies'
    if (value === 'companys') return 'companies'
    return null
}

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function normalizedLastmod(entry: WPEntry) {
    const value = entry.modified || entry.date
    return value ? value.slice(0, 10) : undefined
}

async function fetchCollection(shard: SitemapShard, locale?: Locale): Promise<SitemapEntry[]> {
    const collection = COLLECTIONS[shard]
    if (!collection) return []
    const fetchPage = (page: number) => wpFetchWithTotal<WPEntry>(
            `/wp/v2/${collection.restBase}${buildParams({
                page,
                per_page: 100,
                status: 'publish',
                _fields: locale ? 'slug,date,modified,translations' : 'slug,date,modified',
                orderby: 'modified',
                order: 'desc',
            })}`,
            { revalidate: 300, tags: [collection.tag] },
        )
    const first = await fetchPage(1)
    if (first.total === 0 || first.items.length === 0) throw new Error(`Sitemap ${shard} retornou vazio`)
    if (first.total > 50_000) throw new Error(`Sitemap ${shard} excede 50 mil URLs`)

    const entries = [...first.items]
    const concurrency = 4
    for (let page = 2; page <= first.totalPages; page += concurrency) {
        const pages = Array.from(
            { length: Math.min(concurrency, first.totalPages - page + 1) },
            (_, index) => page + index,
        )
        const results = await Promise.all(pages.map(fetchPage))
        results.forEach((result) => entries.push(...result.items))
    }
    if (entries.length !== first.total) {
        throw new Error(`Sitemap ${shard} incompleto: ${entries.length}/${first.total}`)
    }

    if (!locale) {
        return entries.map((entry) => ({
            loc: `${SITE_URL}/${collection.publicBase}/${entry.slug}`,
            lastmod: normalizedLastmod(entry),
        }))
    }

    // Sem tradução publicada a ficha não existe no idioma — fica fora do sitemap.
    return entries
        .filter((entry) => entry.translations && locale in entry.translations)
        .map((entry) => {
            const pt = `${SITE_URL}/${collection.publicBase}/${entry.slug}`
            const localized = `${SITE_URL}/${locale}/${collection.publicBase}/${entry.slug}`
            return {
                loc: localized,
                lastmod: normalizedLastmod(entry),
                alternates: {
                    [LOCALE_META[DEFAULT_LOCALE].htmlLang]: pt,
                    [LOCALE_META[locale].htmlLang]: localized,
                    'x-default': pt,
                },
            }
        })
}

async function fetchPages(): Promise<SitemapEntry[]> {
    const hubs = await getAllHubs()
    return [
        ...STATIC_PAGES.map((path) => ({ loc: path ? `${SITE_URL}/${path}` : SITE_URL })),
        ...hubs.map((hub) => ({ loc: `${SITE_URL}/guias/${hub.slug}` })),
    ]
}

export async function getLocalizedSitemapEntries(shard: LocalizedShard, locale: Locale): Promise<SitemapEntry[]> {
    const items = await fetchCollection(shard, locale)
    // A home do idioma entra no primeiro shard do idioma, para nao repetir a
    // mesma URL em varios sitemaps — mesmo que esse shard nao tenha fichas.
    const ehPrimeiro = shard === LOCALIZED_SHARDS[0]
    const idiomaTemFichas = items.length > 0 || (ehPrimeiro && (await Promise.all(
        LOCALIZED_SHARDS.slice(1).map((outro) => fetchCollection(outro, locale)),
    )).some((lista) => lista.length > 0))
    const home = ehPrimeiro && idiomaTemFichas
        ? [{ loc: `${SITE_URL}/${locale}`, alternates: { [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/`, [LOCALE_META[locale].htmlLang]: `${SITE_URL}/${locale}`, 'x-default': `${SITE_URL}/` } }]
        : []
    if (items.length === 0) return home
    // A listagem do idioma só existe (e só é indexável) quando há fichas.
    const collection = COLLECTIONS[shard]!
    const pt = `${SITE_URL}/${collection.publicBase}`
    const listing = `${SITE_URL}/${locale}/${collection.publicBase}`
    return [
        ...home,
        { loc: listing, alternates: { [LOCALE_META[DEFAULT_LOCALE].htmlLang]: pt, [LOCALE_META[locale].htmlLang]: listing, 'x-default': pt } },
        ...items,
    ]
}

export async function getSitemapEntries(shard: SitemapShard): Promise<SitemapEntry[]> {
    return shard === 'pages' ? fetchPages() : fetchCollection(shard)
}

export function buildSitemapIndex() {
    const localized = localizedSitemapLocales().flatMap((locale) => LOCALIZED_SHARDS.map((shard) => `${shard}-${locale}`))
    const entries = [...SITEMAP_SHARDS, ...localized]
        .map((shard) => `  <sitemap><loc>${SITE_URL}/sitemaps/${shard}.xml</loc></sitemap>`)
        .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`
}

export function buildUrlSet(entries: SitemapEntry[]) {
    const unique = new Set(entries.map((entry) => entry.loc))
    if (unique.size !== entries.length) throw new Error('Sitemap contém URLs duplicadas')
    const urls = entries.map((entry) => {
        const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
        const alternates = Object.entries(entry.alternates ?? {})
            .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}"/>`)
            .join('')
        return `  <url><loc>${escapeXml(entry.loc)}</loc>${lastmod}${alternates}</url>`
    }).join('\n')
    const xhtml = entries.some((entry) => entry.alternates) ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}>\n${urls}\n</urlset>\n`
}

export function sitemapResponse(xml: string) {
    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
    })
}

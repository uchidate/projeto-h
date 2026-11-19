import Link from '@/components/i18n/LocalizedLink'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { href } from '@/lib/i18n/routes'
import { getHubItems } from '@/lib/guias/hub-items'
import { getMapaDeGuias } from '@/lib/guias/i18n'
import type { WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'
import { EntityGrid } from '@/components/features/LocalizedCatalog'

/**
 * Guia em outro idioma: o texto e o slug vêm da tradução publicada no WordPress (lib/guias/i18n.ts) e a grade lista só
 * as fichas com página traduzida (`oc_locale`), com o mesmo filtro do guia em português. Tradução desatualizada mostra o
 * texto em português, fora do índice.
 */
const POR_GUIA = 48

const TIPO_DA_FICHA = { productions: 'production', artists: 'artist', groups: 'group' } as const
const ROTA_DA_LISTAGEM = { productions: 'productions', artists: 'artists', groups: 'groups' } as const

const caminhoPt = (slugPt: string) => `/guias/${slugPt}`

async function carregar(slugPublico: string, locale: Locale) {
    const mapa = await getMapaDeGuias()
    const slugPt = mapa.slugPt(slugPublico, locale)
    const original = slugPt ? mapa.hubs.find((h) => h.slug === slugPt) : undefined
    const hub = original && mapa.localizar(original, locale)
    if (!slugPt || !hub) return null
    const r = await getHubItems(hub, { locale, perPage: POR_GUIA })
    const tipo = TIPO_DA_FICHA[r.kind]
    const produtos = (r.items as Array<WPArtist | WPGroup | WPProduction>).filter((p) => hasLocale(p, locale)).map((p) => localizeEntity(p, locale, tipo))
    const total = r.total
    return { slugPt, hub, produtos, total, kind: r.kind, alternativas: mapa.alternativas(slugPt) }
}

export async function buildLocalizedGuideMetadata(slugPublico: string, locale: Locale): Promise<Metadata> {
    const dados = await carregar(slugPublico, locale)
    if (!dados) return {}
    const url = `${SITE_URL}${href('guide', { slug: slugPublico }, locale)}`
    return {
        title: dados.hub.seoTitle || dados.hub.title,
        description: dados.hub.seoDescription || dados.hub.description,
        alternates: {
            canonical: url,
            languages: dados.alternativas ?? {
                [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}${caminhoPt(dados.slugPt)}`,
                [LOCALE_META[locale].htmlLang]: url,
                'x-default': `${SITE_URL}${caminhoPt(dados.slugPt)}`,
            },
        },
        robots: { index: dados.produtos.length > 0 && !dados.hub.desatualizado, follow: true },
    }
}

export async function LocalizedGuide({ slugPublico, locale }: { slugPublico: string; locale: Locale }) {
    const [t, dados] = await Promise.all([getTranslations({ locale, namespace: 'entity.guides' }), carregar(slugPublico, locale)])
    if (!dados) notFound()
    const { hub, produtos, total, kind } = dados
    const sufixo = kind === 'artists' ? 'Artists' : kind === 'groups' ? 'Groups' : ''
    const relacionados = hub.relatedSearches ?? []
    return (
        <div className="page-wrap py-10 sm:py-14">
            <nav className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                <Link href={href('guides', undefined, locale)} className="hover:text-accent">← {t('back')}</Link>
            </nav>
            <header className="mb-8 border-b border-border pb-6">
                <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] sm:text-[44px]">{hub.title}</h1>
                <div className="mt-3 max-w-2xl space-y-3 text-[15px] leading-relaxed text-foreground/75">
                    {hub.intro.map((p) => <p key={p}>{p}</p>)}
                </div>
                {hub.whatYouWillFind && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">{hub.whatYouWillFind}</p>}
                {total > 0 && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t(kind, { count: total })}</p>}
            </header>

            {produtos.length === 0
                ? <p className="text-[15px] text-muted">{t(`empty${sufixo}` as 'empty')}</p>
                : <EntityGrid items={produtos} kind={kind} locale={locale} />}
            {total > produtos.length && (
                <p className="mt-6"><Link href={href(ROTA_DA_LISTAGEM[kind], undefined, locale)} className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent hover:underline">{t(`seeAll${sufixo}` as 'seeAll')} →</Link></p>
            )}

            {hub.faq.length > 0 && (
                <section className="mt-12 max-w-3xl" aria-labelledby="guia-faq">
                    <h2 id="guia-faq" className="mb-4 text-[22px] font-black tracking-[-0.02em]">{t('faq')}</h2>
                    <dl className="space-y-5">
                        {hub.faq.map((item) => (
                            <div key={item.question}>
                                <dt className="text-[16px] font-bold">{item.question}</dt>
                                <dd className="mt-1 text-[15px] leading-relaxed text-foreground/75">{item.answer}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            {relacionados.length > 0 && (
                <section className="mt-12" aria-labelledby="guia-relacionados">
                    <h2 id="guia-relacionados" className="mb-3 text-[22px] font-black tracking-[-0.02em]">{t('related')}</h2>
                    <ul className="flex flex-wrap gap-2">
                        {relacionados.map((r) => (
                            <li key={r.href}>
                                <Link href={r.href} className="inline-block border border-border px-3 py-1.5 text-[13px] font-semibold hover:border-accent hover:text-accent">{r.label}</Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}

export async function buildLocalizedGuidesIndexMetadata(locale: Locale): Promise<Metadata> {
    const [t, mapa] = await Promise.all([getTranslations({ locale, namespace: 'entity.guides' }), getMapaDeGuias()])
    const url = `${SITE_URL}${href('guides', undefined, locale)}`
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: url,
            languages: mapa.alternativasDoIndice() ?? { [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/guias`, [LOCALE_META[locale].htmlLang]: url, 'x-default': `${SITE_URL}/guias` },
        },
        robots: { index: mapa.traduzidos(locale).length > 0, follow: true },
    }
}

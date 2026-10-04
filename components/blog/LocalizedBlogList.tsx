import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getPosts } from '@/lib/wordpress/posts'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { paginaDe, paginaInvalida } from '@/lib/listagem'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

/**
 * Listagem do blog em outro idioma. Artigo com tradução publicada (D5-a) aparece
 * com título e imagem da versão traduzida e abre nela; os demais mostram o selo
 * "PT" e abrem direto no original: uma página de artigo em inglês com o corpo em
 * português seria um beco sem saída (decisão em docs/I18N-V2.md). A listagem fica
 * fora do índice enquanto nenhum artigo tiver tradução publicada.
 */
const POR_PAGINA = 12

const urlDaPagina = (locale: Locale, page: number) => `${href('blog', undefined, locale)}${page > 1 ? `?page=${page}` : ''}`

/** Traduções publicadas no idioma, por slug do original em português. */
async function traducoesPorOriginal(locale: Locale) {
    const { items } = await getPosts({ lang: locale, perPage: 100, includeContent: false })
    const mapa = new Map<string, (typeof items)[number]>()
    for (const post of items) {
        const original = post.translations?.[DEFAULT_LOCALE]
        if (original) mapa.set(original, post)
    }
    return mapa
}

export async function buildLocalizedBlogMetadata(locale: Locale, pageParam?: string): Promise<Metadata> {
    const [t, traducoes] = await Promise.all([getTranslations({ locale, namespace: 'entity.blog' }), traducoesPorOriginal(locale)])
    const page = paginaDe(pageParam)
    return {
        title: page > 1 ? `${t('title')} — ${page}` : t('title'),
        description: t('description'),
        alternates: { canonical: `${SITE_URL}${urlDaPagina(locale, page)}` },
        robots: { index: traducoes.size > 0, follow: true },
    }
}

export async function LocalizedBlogList({ locale, pageParam }: { locale: Locale; pageParam?: string }) {
    const page = paginaDe(pageParam)
    const [t, tc, { items, total, totalPages }, traducoes] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.blog' }),
        getTranslations({ locale, namespace: 'entity.catalog' }),
        getPosts({ page, perPage: POR_PAGINA, includeContent: false }),
        traducoesPorOriginal(locale),
    ])
    if (paginaInvalida(page, totalPages)) notFound()
    const data = new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' })
    return (
        <div className="page-wrap py-10 sm:py-14">
            <header className="mb-8 border-b border-border pb-6">
                <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] sm:text-[44px]">{t('title')}</h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70">{t('description')}</p>
                <p className="mt-3 text-[13px] text-muted">{t('note')}</p>
                {total > 0 && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t('count', { count: total })}</p>}
            </header>

            {items.length === 0 ? (
                <p className="text-[15px] text-muted">{t('empty')}</p>
            ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((original) => {
                        const traduzido = traducoes.get(original.slug)
                        const post = traduzido ?? original
                        const titulo = stripHtml(post.title.rendered)
                        const imagem = getWPImage(post._embedded, post.featured_image_url, titulo)
                        return (
                            <li key={post.id}>
                                <Link href={traduzido ? href('post', { slug: post.slug }, locale) : `/blog/${post.slug}`} hrefLang={LOCALE_META[traduzido ? locale : DEFAULT_LOCALE].htmlLang} className="group block">
                                    <div className="relative aspect-16/10 overflow-hidden bg-surface">
                                        {imagem && (
                                            <Image src={imagem.src} alt={imagem.alt || titulo} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                        )}
                                        {!traduzido && <span className="absolute left-2 top-2 border border-white/25 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white">{tc('badge')}</span>}
                                    </div>
                                    <p className="mt-2 text-[16px] font-bold leading-tight transition-colors group-hover:text-accent">{titulo}</p>
                                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{data.format(new Date(post.date))}</p>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}

            {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-between border-t border-border pt-4 font-mono text-[12px]" aria-label={tc('pageOf', { page, total: totalPages })}>
                    {page > 1 ? <Link href={urlDaPagina(locale, page - 1)} className="hover:text-accent">{tc('previous')}</Link> : <span />}
                    <span className="text-muted">{tc('pageOf', { page, total: totalPages })}</span>
                    {page < totalPages ? <Link href={urlDaPagina(locale, page + 1)} className="hover:text-accent">{tc('next')}</Link> : <span />}
                </nav>
            )}
        </div>
    )
}

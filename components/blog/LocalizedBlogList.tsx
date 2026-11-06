import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getPosts } from '@/lib/wordpress/posts'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { paginaDe, paginaInvalida } from '@/lib/listagem'
import { LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { slugPublicoDoPost } from '@/lib/blog/translations'

/**
 * Listagem do blog em outro idioma: só artigos com tradução publicada (D5-a), com título e imagem da
 * versão traduzida. Os originais em português ficam de fora, para a página não misturar idiomas
 * (decisão em docs/I18N-V2.md). Pagina e filtra por categoria direto no WordPress (`lang`), então
 * cobre todas as traduções, não só as primeiras. Categoria desconhecida é 404; sem nenhum artigo a
 * página fica fora do índice.
 */
const POR_PAGINA = 12

/** Categorias oferecidas como filtro, na ordem em que aparecem (o rótulo vem de `home.categorias`). */
const CATEGORIAS = ['k-pop', 'k-drama', 'k-film', 'cultura', 'k-beauty', 'reality-shows', 'webtoons'] as const

const urlDaPagina = (locale: Locale, page: number, category?: string) => {
    const query = [category ? `category=${category}` : '', page > 1 ? `page=${page}` : ''].filter(Boolean).join('&')
    return `${href('blog', undefined, locale)}${query ? `?${query}` : ''}`
}

type Rotulos = { (chave: string): string; has(chave: string): boolean }
const rotuloDaCategoria = async (locale: Locale) => (await getTranslations({ locale, namespace: 'home.categorias' })) as unknown as Rotulos

const categoriaValida = (category?: string) => (category === undefined || (CATEGORIAS as readonly string[]).includes(category) ? category : null)

export async function buildLocalizedBlogMetadata(locale: Locale, pageParam?: string, categoryParam?: string): Promise<Metadata> {
    const category = categoriaValida(categoryParam)
    if (category === null) return { robots: { index: false, follow: false } }
    const [t, rotulos, traduzidos] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.blog' }),
        rotuloDaCategoria(locale),
        getPosts({ lang: locale, category, perPage: 1, includeContent: false }),
    ])
    const page = paginaDe(pageParam)
    const base = category ? `${rotulos(category)} · ${t('title')}` : t('title')
    return {
        title: page > 1 ? `${base} — ${page}` : base,
        description: t('description'),
        alternates: { canonical: `${SITE_URL}${urlDaPagina(locale, page, category)}` },
        robots: { index: traduzidos.total > 0, follow: true },
    }
}

export async function LocalizedBlogList({ locale, pageParam, categoryParam }: { locale: Locale; pageParam?: string; categoryParam?: string }) {
    const category = categoriaValida(categoryParam)
    if (category === null) notFound()
    const page = paginaDe(pageParam)
    const [t, tc, rotulos, lista, totais] = await Promise.all([
        getTranslations({ locale, namespace: 'entity.blog' }),
        getTranslations({ locale, namespace: 'entity.catalog' }),
        rotuloDaCategoria(locale),
        getPosts({ lang: locale, category, page, perPage: POR_PAGINA, includeContent: false }),
        Promise.all(CATEGORIAS.map(async (slug) => ({ slug, total: (await getPosts({ lang: locale, category: slug, perPage: 1, includeContent: false })).total }))),
    ])
    const total = lista.total
    const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA))
    if (paginaInvalida(page, totalPages)) notFound()
    const data = new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' })
    const filtros = totais.filter((c) => c.total > 0)
    return (
        <div className="page-wrap py-10 sm:py-14">
            <header className="mb-8 border-b border-border pb-6">
                <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] sm:text-[44px]">{category ? rotulos(category) : t('title')}</h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70">{t('description')}</p>
                {total > 0 && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t('count', { count: total })}</p>}
                {filtros.length > 1 && (
                    <nav aria-label={t('categories')} className="mt-5 flex flex-wrap gap-2">
                        <Link href={urlDaPagina(locale, 1)} aria-current={category ? undefined : 'page'}
                            className={`border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${category ? 'border-border text-foreground hover:border-accent hover:text-accent' : 'border-foreground bg-foreground text-background'}`}>{t('back')}</Link>
                        {filtros.map((c) => (
                            <Link key={c.slug} href={urlDaPagina(locale, 1, c.slug)} aria-current={category === c.slug ? 'page' : undefined}
                                className={`border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${category === c.slug ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:border-accent hover:text-accent'}`}>{rotulos(c.slug)}</Link>
                        ))}
                    </nav>
                )}
            </header>

            {lista.items.length === 0 ? (
                <p className="text-[15px] text-muted">{t('empty')}</p>
            ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {lista.items.map((post) => {
                        const titulo = stripHtml(post.title.rendered)
                        const imagem = getWPImage(post._embedded, post.featured_image_url, titulo)
                        return (
                            <li key={post.id}>
                                <Link href={href('post', { slug: slugPublicoDoPost(post.translations, post.slug) }, locale)} hrefLang={LOCALE_META[locale].htmlLang} className="group block">
                                    <div className="relative aspect-16/10 overflow-hidden bg-surface">
                                        {imagem && (
                                            <Image src={imagem.src} alt={imagem.alt || titulo} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                        )}
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
                    {page > 1 ? <Link href={urlDaPagina(locale, page - 1, category)} className="hover:text-accent">{tc('previous')}</Link> : <span />}
                    <span className="text-muted">{tc('pageOf', { page, total: totalPages })}</span>
                    {page < totalPages ? <Link href={urlDaPagina(locale, page + 1, category)} className="hover:text-accent">{tc('next')}</Link> : <span />}
                </nav>
            )}
        </div>
    )
}

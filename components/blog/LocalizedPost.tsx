import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SITE_NAME, SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { LOCALE_META, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { buildArticleModel } from '@/lib/blog/articleModel'
import { buildPostAlternates } from '@/lib/blog/translations'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { metaDescription } from '@/lib/seo/metaDescription'
import { JsonLd } from '@/components/seo/JsonLd'
import { GutenbergArticleRenderer } from '@/components/blog/GutenbergArticleRenderer'

/**
 * Artigo traduzido (D5-a): um post próprio por idioma, publicado no WordPress
 * com slug, título e Rank Math no idioma de destino. É propositalmente mais
 * enxuto que a página em português: sem widgets de experimento, anúncios
 * laterais nem cartões de entidade, que ainda têm textos fixos em português.
 * Publicar o post no WP é o que o torna indexável (só `publish` chega aqui).
 */

function tituloEDescricao(post: WPPost) {
    const titulo = stripHtml(post.title.rendered)
    const seoTitle = (post.meta?.rank_math_title as string | undefined) || titulo
    const descricao = (post.meta?.rank_math_description as string | undefined)
        || metaDescription(post.acf?.subtitle?.trim() || stripHtml(post.excerpt.rendered))
    return { titulo, seoTitle, descricao }
}

export function buildLocalizedPostMetadata(post: WPPost, locale: Locale): Metadata {
    const { titulo, seoTitle, descricao } = tituloEDescricao(post)
    const image = getWPImage(post._embedded, post.featured_image_url, titulo)
    const { canonical, languages } = buildPostAlternates(post.translations, locale, post.slug)
    return buildWordPressMetadata({
        title: seoTitle,
        description: descricao,
        url: canonical,
        image,
        article: { publishedTime: post.date, modifiedTime: post.modified },
        ogImageOverride: buildOgImageUrl({ title: titulo, subtitle: descricao, image: image?.src, type: 'post' }),
        languages,
        ogLocale: LOCALE_META[locale].ogLocale,
    })
}

function corpo(post: WPPost) {
    if (post.article_blocks?.length) {
        try {
            return <GutenbergArticleRenderer model={buildArticleModel(post.article_blocks)} />
        } catch {
            // bloco ainda sem suporte no renderizador: cai no HTML do WordPress
        }
    }
    return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
}

export async function LocalizedPost({ post, locale }: { post: WPPost; locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'entity.blog' })
    const { titulo, descricao } = tituloEDescricao(post)
    const subtitulo = post.acf?.subtitle?.trim()
    const imagem = getWPImage(post._embedded, post.featured_image_url, titulo)
    const { canonical } = buildPostAlternates(post.translations, locale, post.slug)
    const slugPt = post.translations?.[DEFAULT_LOCALE]
    const data = new Intl.DateTimeFormat(LOCALE_META[locale].intl, { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(post.date))

    return (
        <>
            <JsonLd data={buildBreadcrumbSchema([
                { name: SITE_NAME, url: `${SITE_URL}${href('home', undefined, locale)}` },
                { name: t('title'), url: `${SITE_URL}${href('blog', undefined, locale)}` },
                { name: titulo, url: canonical },
            ])} />
            <JsonLd data={buildArticleSchema({
                type: 'BlogPosting',
                headline: titulo,
                description: descricao,
                url: canonical,
                datePublished: post.date,
                dateModified: post.modified,
                image: imagem?.src ? [imagem.src] : undefined,
                author: { type: 'Organization', name: SITE_NAME, url: `${SITE_URL}${href('about', undefined, locale)}` },
                publisher: { name: SITE_NAME, url: SITE_URL },
                wordCount: stripHtml(post.content.rendered).split(/\s+/).filter(Boolean).length,
                inLanguage: LOCALE_META[locale].htmlLang,
            })} />
            <article className="page-wrap mx-auto max-w-3xl py-10 sm:py-14">
                <Link href={href('blog', undefined, locale)} className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted hover:text-accent">← {t('back')}</Link>
                <header className="mt-4 border-b border-border pb-6">
                    <h1 className="text-[30px] font-black leading-tight tracking-[-0.03em] sm:text-[42px]">{titulo}</h1>
                    {subtitulo && <p className="mt-3 text-[17px] leading-relaxed text-foreground/70">{subtitulo}</p>}
                    <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t('publishedOn', { date: data })}</p>
                </header>
                {imagem && (
                    <div className="relative my-6 aspect-16/9 overflow-hidden bg-surface">
                        <Image src={imagem.src} alt={imagem.alt || titulo} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
                    </div>
                )}
                {corpo(post)}
                <footer className="mt-10 border-t border-border pt-4 text-[13px] text-muted">
                    <p>{t('translatedNote')}</p>
                    {slugPt && (
                        <p className="mt-1">
                            <a href={href('post', { slug: slugPt }, DEFAULT_LOCALE)} hrefLang={LOCALE_META[DEFAULT_LOCALE].htmlLang} className="underline underline-offset-2 hover:text-accent">{t('readOriginal')}</a>
                        </p>
                    )}
                </footer>
            </article>
        </>
    )
}

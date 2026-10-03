import { getTranslations } from 'next-intl/server'
import { HomePtBadge } from '@/components/home/HomePtBadge'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import { SITE_NAME } from '@/lib/constants/site'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { WPPost, WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { homeCatName } from '@/lib/home/catStyle'

async function HeroPost({ post, locale }: { post: WPPost; locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    const data = formatDatePt(post.date, intlLocale(locale))
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt?.rendered ?? '').slice(0, 160)
    const mins = readingTime(post.content?.rendered ?? '')

    return (
        <div className="lg:flex lg:h-[400px]">
            <Link {...postLink(post.slug, locale)}
                className="group relative block min-w-0 overflow-hidden border-b border-border lg:w-[50%] lg:shrink-0 lg:border-b-0 lg:border-r">
                <div className="relative aspect-16/10 w-full sm:aspect-video lg:h-full lg:aspect-auto">
                    {image ? (
                        <Image src={image.src} alt={image.alt || title} fill priority fetchPriority="high"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                    ) : (
                        <div className="absolute inset-0 bg-surface flex items-center justify-center">
                            <span className="font-black text-[100px] leading-none text-accent/10">한류</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex min-w-0 flex-col border-b border-border bg-background px-4 py-5 sm:px-6 sm:py-6 lg:hidden">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
                    <span className="text-accent">{tc('capa')}</span>
                    <span className="text-muted/45" aria-hidden="true">·</span>
                    <span className="text-muted">{homeCatName(post, undefined, tc('artigo'))}</span>
                    <span className="text-muted/45" aria-hidden="true">·</span>
                    <span className="text-muted">{tc('minutosDeLeitura', { mins })}</span>
                    <HomePtBadge locale={locale} />
                </div>
                <Link {...postLink(post.slug, locale)} className="group mt-3 min-w-0">
                    {/* Variante mobile do mesmo título: como <h1>, formava par com o
                        hero desktop e o crawler (que não aplica breakpoint) via dois H1.
                        role/aria-level preserva o cabeçalho para leitor de tela. */}
                    <p role="heading" aria-level={1} className="min-w-0 max-w-[22ch] wrap-anywhere font-serif text-[clamp(1.8rem,7.6vw,2.6rem)] font-medium leading-[1.03] tracking-[-0.035em] text-foreground transition-colors group-hover:text-accent">
                        {title}
                    </p>
                </Link>
                {excerpt && <p className="mt-3 max-w-[58ch] text-[13px] leading-5 text-muted line-clamp-2">{excerpt}</p>}
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span className="min-w-0 truncate text-[11px] text-muted">{data}</span>
                    <Link {...postLink(post.slug, locale)}
                        className="shrink-0 whitespace-nowrap border-b border-accent pb-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
                        {`${t('lerAgora')} `}<span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>

            <div className="hidden lg:flex relative min-w-0 flex-1 flex-col bg-background px-8 py-7 overflow-hidden">
                <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
                        <span className="inline-flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            {tc('capa')}
                        </span>
                        <span className="text-muted/45">·</span>
                        <span className="text-muted">{homeCatName(post, undefined, tc('artigo'))}</span>
                        <span className="text-muted/45">·</span>
                        <span className="text-muted">{tc('minutosDeLeitura', { mins })}</span>
                        <HomePtBadge locale={locale} />
                    </div>
                </div>
                <Link {...postLink(post.slug, locale)} className="group relative">
                    <h1 className="min-w-0 max-w-[20ch] wrap-anywhere font-serif text-home-hero font-medium text-foreground transition-colors group-hover:text-accent">
                        {title}
                    </h1>
                </Link>
                {excerpt && <p className="mt-5 max-w-[52ch] text-[15px] leading-[1.65] text-foreground/65 line-clamp-3">{excerpt}</p>}
                <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                    <span className="text-[12px] text-muted"><b className="text-foreground">{SITE_NAME}</b> · {data}</span>
                    <Link {...postLink(post.slug, locale)}
                        className="inline-flex items-center gap-2 bg-accent-a11y px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-accent-a11y/90 transition-colors shrink-0">
                        {`${t('continuarLeitura')} `}<span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

async function HeroProduction({ production, locale }: { production: WPProduction; locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    const image = getWPImage(production._embedded, production.featured_image_url)
    const title = stripHtml(production.title.rendered)
    const acf = production.acf ?? {}
    return (
        <Link href={rota('production', { slug: production.slug }, locale)}
            className="group relative flex items-end overflow-hidden min-h-[420px] lg:min-h-[420px]">
            {image ? (
                <Image src={image.src} alt={title} fill priority fetchPriority="high"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                    sizes="(min-width: 1440px) 1440px, 100vw" />
            ) : <div className="absolute inset-0 bg-surface" />}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
            <div className="relative p-6 lg:p-12 max-w-3xl">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-accent mb-4">
                    {acf.type === 'movie' ? t('filmeEmDestaque') : t('doramaEmDestaque')}
                </p>
                <h1 className="font-serif text-home-hero-xl font-medium text-white group-hover:text-accent transition-colors">
                    {title}
                </h1>
                {acf.rating != null && (
                    <div className="flex items-center gap-1.5 mt-4 text-[13px] font-bold text-white/80">
                        <Star size={12} fill="currentColor" className="text-yellow-400" />
                        {Number(acf.rating).toFixed(1)} · {acf.year}
                    </div>
                )}
            </div>
        </Link>
    )
}

async function HeroFallback({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    return (
        <div className="grid min-h-[360px] border-b border-border lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-10">
                <p className="font-mono text-home-label font-black uppercase text-accent">{t('fallbackEyebrow')}</p>
                <h1 className="mt-3 max-w-[12ch] text-home-hero-xl font-black text-foreground">
                    {t('fallbackTitulo')}
                </h1>
                <div className="mt-7 flex flex-wrap gap-2">
                    <Link href={rota('blog', undefined, locale)} className="bg-accent-a11y px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">{t('verArtigos')}</Link>
                    <Link href={rota('artists', undefined, locale)} className="border border-foreground px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em]">{t('artistas')}</Link>
                </div>
            </div>
            <div className="relative hidden overflow-hidden border-l border-border bg-foreground text-background lg:block">
                <span className="absolute -right-10 top-4 text-[180px] font-black leading-none tracking-[-0.12em] text-white/[0.07]">한류</span>
                <div className="relative flex h-full flex-col justify-end p-10">
                    <p className="font-mono text-home-label font-black uppercase text-accent">{SITE_NAME}</p>
                    <p className="mt-3 max-w-[28ch] text-home-title-lg font-black leading-[1.1]">
                        {t('fallbackSubtitulo')}
                    </p>
                </div>
            </div>
        </div>
    )
}

interface Props {
    post?: WPPost
    production?: WPProduction
    locale?: Locale
}

export function HomeHero({ post, production, locale = DEFAULT_LOCALE }: Props) {
    if (post) return <HeroPost post={post} locale={locale} />
    if (production) return <HeroProduction production={production} locale={locale} />
    return <HeroFallback locale={locale} />
}

import { getTranslations } from 'next-intl/server'
import { HomePtBadge } from '@/components/home/HomePtBadge'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import Image from 'next/image'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { Clock } from 'lucide-react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'

export async function HomeLongreads({ posts, locale = DEFAULT_LOCALE }: { posts: WPPost[]; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.longreads' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    const data = (date: string) => formatDatePt(date, intlLocale(locale))
    return (
        <div className="border-b border-border px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-10">
            <SectionTitleBar title={t('titulo')} href={rota('blog', undefined, locale)} linkText={t('arquivo')} className="mb-3" />
            <div>
                {posts.map((post, index) => {
                    const image = getWPImage(post._embedded, post.featured_image_url)
                    const title = stripHtml(post.title.rendered)
                    const excerpt = stripHtml(post.excerpt?.rendered ?? '').slice(0, 120)
                    const mins = post.acf?.reading_time ?? readingTime(post.content?.rendered ?? '')
                    const isLead = index === 0
                    return (
                        <Link key={post.id} {...postLink(post.slug, locale)}
                            className={isLead
                                ? 'group grid grid-cols-1 gap-4 border-b border-border pb-7 pt-4 transition-colors hover:bg-surface/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] sm:gap-6 sm:py-6'
                                : 'group grid grid-cols-[100px_minmax(0,1fr)] gap-4 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-surface/40 sm:grid-cols-[136px_minmax(0,1fr)_88px] sm:gap-5 sm:py-5 lg:grid-cols-[148px_minmax(0,1fr)_88px]'}>
                            <div className={`relative overflow-hidden bg-surface ${isLead ? 'aspect-16/10' : 'aspect-3/4'}`}>
                                {image ? (
                                    <Image src={image.src} alt={title} fill sizes={isLead ? '(max-width: 640px) 100vw, 45vw' : '148px'}
                                        className="object-cover object-top" />
                                ) : <div className="h-full bg-surface" />}
                                {isLead && (
                                    <span className="absolute top-1.5 left-1.5 bg-accent-a11y text-white font-mono text-[8px] font-black uppercase px-1.5 py-0.5 leading-none">{tc('capa')}</span>
                                )}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="inline-flex items-center gap-1.5 w-fit rounded-xs bg-accent/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-accent">
                                    <Clock size={8} /> {tc('minutos', { mins })}
                                </span>
                                {locale !== DEFAULT_LOCALE && <span className="mt-1 w-fit"><HomePtBadge locale={locale} /></span>}
                                <h3 className={`mt-2 font-serif font-medium text-foreground transition-colors group-hover:text-accent ${isLead ? 'text-[clamp(1.45rem,4vw,2rem)] leading-[1.08]' : 'text-home-title line-clamp-3 sm:line-clamp-2'}`}>
                                    {title}
                                </h3>
                                {excerpt && <p className={`mt-1.5 line-clamp-2 text-home-body-lg text-muted ${isLead ? 'block' : 'hidden sm:block'}`}>{excerpt}</p>}
                                {isLead && <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{data(post.date)}</span>}
                            </div>
                            {!isLead && (
                                <span className="hidden self-start pt-1 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:block">
                                    {data(post.date)}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

import { getTranslations } from 'next-intl/server'
import { HomePtBadge } from '@/components/home/HomePtBadge'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import Image from 'next/image'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, readingTime } from '@/lib/utils'
import { homeCatName } from '@/lib/home/catStyle'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'

const TAG = 'inline-flex w-fit items-center border border-[#6d3fc0] px-1.5 py-1 font-mono text-[9px] font-black uppercase leading-none tracking-[0.12em] text-[#6d3fc0]'
const META = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted'

export async function HomeLongreads({ posts, locale = DEFAULT_LOCALE }: { posts: WPPost[]; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.longreads' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    const curta = (date: string) => new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date)).replace('.', '')
    const [destaque, ...demais] = posts
    if (!destaque) return null

    const dados = (post: WPPost) => {
        const image = getWPImage(post._embedded, post.featured_image_url)
        const title = stripHtml(post.title.rendered)
        const excerpt = stripHtml(post.excerpt?.rendered ?? '')
        const mins = post.acf?.reading_time ?? (post.content?.rendered ? readingTime(post.content.rendered) : null)
        const meta = [mins ? tc('minutosDeLeitura', { mins }) : null, curta(post.date)].filter(Boolean).join(' · ')
        return { image, title, excerpt, meta, categoria: homeCatName(post, undefined, tc('artigo')) }
    }
    const lead = dados(destaque)

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-6 lg:py-6">
            <SectionTitleBar title={t('titulo')} tag={t('tag')} tagColor="#6d3fc0" href={rota('blog', undefined, locale)} linkText={t('arquivo')} className="mb-4" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8">
                <Link {...postLink(destaque.slug, locale)} className="group block min-w-0">
                    <div className="relative aspect-16/10 overflow-hidden bg-surface">
                        {lead.image && <Image src={lead.image.src} alt={lead.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-top" />}
                    </div>
                    <span className={`${TAG} mt-4`}>{lead.categoria}</span>
                    {locale !== DEFAULT_LOCALE && <span className="mt-1 block w-fit"><HomePtBadge locale={locale} /></span>}
                    <h3 className="mt-2.5 font-serif text-[clamp(1.5rem,4vw,2.1rem)] font-medium leading-[1.1] tracking-[-0.01em] text-foreground transition-colors group-hover:text-accent">{lead.title}</h3>
                    {lead.excerpt && <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-muted">{lead.excerpt}</p>}
                    <p className={`mt-2.5 ${META}`}>{lead.meta}</p>
                </Link>
                <div className="min-w-0 border-t border-border">
                    {demais.map(post => {
                        const d = dados(post)
                        return (
                            <Link key={post.id} {...postLink(post.slug, locale)} className="group grid grid-cols-[112px_minmax(0,1fr)] gap-3.5 border-b border-border py-3.5 sm:grid-cols-[148px_minmax(0,1fr)]">
                                <div className="relative aspect-video overflow-hidden self-start bg-surface">
                                    {d.image && <Image src={d.image.src} alt={d.title} fill sizes="148px" className="object-cover object-top" />}
                                </div>
                                <div className="min-w-0">
                                    <span className={TAG}>{d.categoria}</span>
                                    <h3 className="mt-2 text-[15px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-[16px]">{d.title}</h3>
                                    {d.excerpt && <p className="mt-1 line-clamp-3 hidden text-[13px] leading-5 text-muted sm:block">{d.excerpt}</p>}
                                    <p className={`mt-1.5 ${META}`}>{d.meta}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

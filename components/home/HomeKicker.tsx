import { getTranslations } from 'next-intl/server'
import { HomePtBadge } from '@/components/home/HomePtBadge'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { WPPost } from '@/lib/wordpress/types'
import { homeCatStyle, homeCatName } from '@/lib/home/catStyle'

interface Props {
    post: WPPost
    categoryMap?: Record<number, { name: string; slug: string }>
    locale?: Locale
}

export async function HomeKicker({ post, categoryMap, locale = DEFAULT_LOCALE }: Props) {
    const t = await getTranslations({ locale, namespace: 'home.comum' })
    const style = homeCatStyle(post, categoryMap)
    const chip = (
        <span className="inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: style.color, backgroundColor: style.bg }}>
            {homeCatName(post, categoryMap, t('artigo'))}
        </span>
    )
    if (locale === DEFAULT_LOCALE) return chip
    return (
        <span className="inline-flex items-center gap-1.5">
            {chip}
            <HomePtBadge locale={locale} />
        </span>
    )
}

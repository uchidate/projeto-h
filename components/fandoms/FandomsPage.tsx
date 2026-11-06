import Link from '@/components/i18n/LocalizedLink'
import { getTranslations } from 'next-intl/server'
import { htmlLang } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { Heart } from 'lucide-react'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { proximasDatas } from '@/lib/fandoms/datas'
import { chaveDia } from '@/lib/quiz/dia'
import { SearchInput } from '@/components/ui/SearchInput'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { EspacoDoFa, type CartaoTorcida } from '@/components/fandoms/EspacoDoFa'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
    fandoms: Fandom[]
    search?: string
    locale?: Locale
}

export async function FandomsPage({ fandoms, search, locale = DEFAULT_LOCALE }: Props) {
    const t = await getTranslations({ locale, namespace: 'client.fandoms' })
    const base = href('fandoms', undefined, locale)
    const hoje = chaveDia()
    // Só o que o espaço do fã precisa, já em formato serializável para o componente de cliente.
    const cartoes: CartaoTorcida[] = fandoms.map(fandom => {
        const principal = fandom.groups[0]
        const imagem = principal ? getWPImage(principal._embedded, principal.featured_image_url) : null
        // Selo de "aniversário perto" na grade: só a estreia do grupo (sem membros, pra não pesar
        // a listagem inteira com dados de artista por torcida).
        const proximaEstreia = proximasDatas(
            fandom.groups.map(g => ({ nome: stripHtml(g.title.rendered), data: g.acf?.debut_date, encerrado: g.acf?.active === false })),
            [], hoje, 14, 1,
        )[0] ?? null
        return {
            slug: fandom.slug, nome: fandom.name, cor: fandom.color ?? '#c39bff',
            grupos: fandom.groups.map(g => stripHtml(g.title.rendered)), grupoSlug: principal?.slug ?? null,
            grupoId: principal?.id ?? null,
            foto: imagem?.src ?? null, ano: principal ? getYear(principal.acf?.debut_date) : null,
            encerrado: fandom.groups.every(g => g.acf?.active === false),
            diasProximaData: proximaEstreia?.dias ?? null,
        }
    })
    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: t('schemaName', { site: SITE_NAME }),
                description: t('schemaDescription'),
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: fandoms.length,
                    itemListElement: fandoms.slice(0, 50).map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.name, url: `${SITE_URL}${href('fandom', { slug: f.slug }, locale)}` })),
                },
                url: `${SITE_URL}${base}`,
                inLanguage: htmlLang(locale),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            <div className="page-wrap py-6 sm:py-10">
                <span className="inline-block -rotate-2 bg-[#ffe14d] px-3 py-1 text-[12px] font-black tracking-[0.08em] text-[#15102b]">{t('badge', { count: fandoms.length })}</span>
                <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-[1] sm:text-[56px]">
                    <span className="sr-only">{t('h1Sr')}</span>{t('h1Pre')}<span className="text-[#ff5fa2]">{t('h1Hi')}</span>{t('h1Post')} <span className="text-[#38e1c0]">✦</span>
                </h1>
                <p className="mt-3 max-w-2xl text-[16px] text-foreground/70">{t('intro')}</p>
                <div className="mt-5 max-w-sm">
                    <SearchInput placeholder={t('searchPlaceholder')} current={search} />
                </div>
            </div>

            <div className="page-wrap pb-8">
                {fandoms.length === 0 ? (
                    <EmptyState
                        icon={<Heart size={48} />}
                        title={t('emptyTitle')}
                        description={search ? t('emptySearch', { search }) : t('emptyNone')}
                        actionHref={base}
                        actionLabel={t('emptyAction')}
                    />
                ) : (
                    <EspacoDoFa cartoes={cartoes} busca={search} />
                )}

                {fandoms.length > 0 && (
                    <section aria-labelledby="oque-fandom" className="mt-14 max-w-3xl space-y-3 text-[16px] leading-relaxed">
                        <h2 id="oque-fandom" className="font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-tight sm:text-[30px]">{t('whatTitle')}</h2>
                        <p>{t('whatP1')}</p>
                        <p>{t('whatP2Pre', { count: fandoms.length })}<Link href="/quiz" className="font-bold underline">{t('whatQuiz')}</Link>{t('whatP2Post')}</p>
                    </section>
                )}

                {fandoms.length > 0 && ADSENSE.slots.inline && (
                    <div className="mt-10">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="fandoms_feed" />
                    </div>
                )}
            </div>
        </>
    )
}

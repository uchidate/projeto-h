import { getTranslations } from 'next-intl/server'
import { href as rota } from '@/lib/i18n/routes'
import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { nameToGradient } from '@/lib/home/catStyle'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

const TIPOS_DE_GRUPO = ['girl_group', 'boy_group', 'co_ed', 'solo'] as const

export async function HomeTrendingGroups({ groups, locale = DEFAULT_LOCALE }: { groups: WPGroup[]; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.gruposEmAlta' })
    const tt = await getTranslations({ locale, namespace: 'home.tipoDeGrupo' })
    const TYPE_LABEL: Record<string, string> = Object.fromEntries(TIPOS_DE_GRUPO.map(k => [k, tt(k)]))
    return (
        <aside className="px-4 py-8 sm:px-6 lg:px-8">
            <SectionTitleBar
                title={t('titulo')}
                action={<span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">{t('aoVivo')}</span>}
                className="mb-3"
            />
            <div>
                {groups.map((group, index) => {
                    const image = getWPImage(group._embedded, group.featured_image_url)
                    const name = stripHtml(group.title.rendered)
                    const acf = group.acf ?? {}
                    const type = acf.type ? (TYPE_LABEL[acf.type] ?? acf.type) : null
                    const fandom = acf.fandom_name ?? null
                    const sub = fandom ? t('fandom', { nome: fandom }) : (type ?? null)
                    return (
                        <Link key={group.id} href={rota('group', { slug: group.slug }, locale)}
                            className={`grid-cols-[42px_44px_minmax(0,1fr)] items-center gap-3 border-b border-border py-3 transition-colors last:border-b-0 hover:bg-background/70 ${index >= 5 ? 'hidden lg:grid' : 'grid'}`}>
                            <span className={`font-serif text-[32px] leading-none ${index < 3 ? 'text-accent' : 'text-muted/45'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={`relative h-11 w-11 overflow-hidden border bg-surface ${index < 3 ? 'border-accent/40 ring-2 ring-accent/20 ring-offset-1 ring-offset-background' : 'border-border'}`}
                                style={{ background: nameToGradient(name) }}>
                                {image ? (
                                    <Image src={image.src} alt={name} fill sizes="44px" className="object-cover object-top" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-white">
                                        {name.slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-foreground">{name}</span>
                                {sub && <span className="mt-0.5 block truncate text-[11px] text-muted">{sub}</span>}
                            </span>
                        </Link>
                    )
                })}
            </div>
            {groups.length > 0 && (
                <Link href={rota('group', { slug: groups[0].slug }, locale)}
                    className="group mt-6 flex overflow-hidden border border-foreground bg-foreground text-background transition-opacity hover:opacity-95">
                    <div className="flex flex-1 flex-col justify-center p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-a11y">{t('grupoDaSemana')}</p>
                        <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] leading-tight">
                            {stripHtml(groups[0].title.rendered)}
                        </h3>
                        <p className="mt-1 text-xs text-background/65">
                            {groups[0].acf?.fandom_name ? t('fandom', { nome: groups[0].acf.fandom_name }) : (groups[0].acf?.type ? (TYPE_LABEL[groups[0].acf.type] ?? '') : t('perfilEmFoco'))}
                        </p>
                    </div>
                    {getWPImage(groups[0]._embedded, groups[0].featured_image_url) && (
                        <div className="relative w-28 shrink-0 overflow-hidden">
                            <Image
                                src={getWPImage(groups[0]._embedded, groups[0].featured_image_url)!.src}
                                alt={stripHtml(groups[0].title.rendered)}
                                fill sizes="112px"
                                className="object-cover object-top"
                            />
                        </div>
                    )}
                </Link>
            )}
            <Link href={rota('groups', undefined, locale)} className="mt-4 flex items-center justify-between border border-border bg-surface px-4 py-3 hover:border-accent/40 transition-colors group">
                <span className="text-[13px] font-black text-foreground group-hover:text-accent transition-colors">{t('verTodos')}</span>
                <span className="text-accent font-mono font-black transition-transform group-hover:translate-x-1">→</span>
            </Link>
        </aside>
    )
}
